import axios from 'axios';
import { env } from '../config/env.js';
import { cachedRequest } from '../utils/cache.js';
import { AppError } from '../utils/errors.js';

// Adapter for the official Fantasy Premier League API
// (https://fantasy.premierleague.com/api). No key, no signup, no hard quota —
// but cached aggressively anyway to stay polite.
//
// Provides the player pool and per-gameweek player statistics. One
// /event/{gw}/live request covers EVERY player's stats for the whole
// gameweek. Before the season starts that endpoint is empty, so scoring
// falls back to each player's real FPL point total from last season,
// averaged per gameweek (element-summary history_past).

const TTL = {
  bootstrap: 12 * 60 * 60 * 1000,
  fixtures: 60 * 60 * 1000,
  liveFinished: 7 * 24 * 60 * 60 * 1000,
  liveInProgress: 5 * 60 * 1000,
  elementSummary: 7 * 24 * 60 * 60 * 1000,
  apiFailure: 5 * 60 * 1000,
};

const SEASON_GAMES = 38;

const client = axios.create({
  baseURL: 'https://fantasy.premierleague.com/api',
  headers: { 'User-Agent': 'Mozilla/5.0 (fantasy-league-course-project)' },
  timeout: 15000,
});

async function apiGet(path) {
  try {
    const response = await client.get(path);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new AppError('FPL_NOT_FOUND', 'FPL resource not found', 502);
    }
    throw new AppError('FPL_UNAVAILABLE', 'Fantasy Premier League API unavailable', 502);
  }
}

function cachedFplRequest(key, ttlMs, fetcher) {
  return cachedRequest(key, ttlMs, fetcher, { failureTtlMs: TTL.apiFailure });
}

const POSITION_BY_TYPE = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

function playerPhoto(code) {
  return `https://resources.premierleague.com/premierleague/photos/players/110x110/p${code}.png`;
}

function teamBadge(code) {
  return `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;
}

async function getBootstrap() {
  return cachedFplRequest('fpl:bootstrap', TTL.bootstrap, () => apiGet('/bootstrap-static/'));
}

export const fpl = {
  enabled() {
    return env.PLAYER_STATS_PROVIDER === 'fpl';
  },

  async getPlayerPool() {
    const data = await getBootstrap();
    const teamsById = new Map(
      (data.teams ?? []).map((t) => [t.id, { id: t.id, name: t.name, logo: teamBadge(t.code) }])
    );

    const players = (data.elements ?? []).map((el) => ({
      id: el.id,
      name: `${el.first_name} ${el.second_name}`,
      age: undefined,
      nationality: undefined,
      photo: playerPhoto(el.code),
      position: POSITION_BY_TYPE[el.element_type] ?? 'MID',
      team: teamsById.get(el.team) ?? null,
    }));

    players.sort(
      (a, b) => (a.team?.name ?? '').localeCompare(b.team?.name ?? '') || a.name.localeCompare(b.name)
    );
    return players;
  },

  async getFixturesForGameweek(gameweek) {
    const [data, bootstrap] = await Promise.all([
      cachedFplRequest(`fpl:fixtures:${gameweek}`, TTL.fixtures, () =>
        apiGet(`/fixtures/?event=${gameweek}`)
      ),
      getBootstrap(),
    ]);
    const teamsById = new Map(
      (bootstrap.teams ?? []).map((t) => [t.id, { id: t.id, name: t.name, logo: teamBadge(t.code) }])
    );

    return (data ?? []).map((fx) => ({
      fixture: {
        id: fx.id,
        date: fx.kickoff_time,
        status: fx.finished
          ? { short: 'FT', long: 'Match Finished' }
          : fx.started
            ? { short: 'LIVE', long: 'In Play' }
            : { short: 'NS', long: 'Not Started' },
      },
      league: { id: env.DEFAULT_LEAGUE_ID, name: 'Premier League' },
      teams: {
        home: teamsById.get(fx.team_h) ?? null,
        away: teamsById.get(fx.team_a) ?? null,
      },
      goals: { home: fx.team_h_score ?? null, away: fx.team_a_score ?? null },
      matchday: fx.event,
    }));
  },

  // Map of playerId -> stats for the whole gameweek. Empty before the season
  // starts (the live endpoint has no elements until GW1 kicks off).
  async getGameweekStatsMap(gameweek, { finished = false } = {}) {
    const ttl = finished ? TTL.liveFinished : TTL.liveInProgress;
    const data = await cachedFplRequest(`fpl:live:${gameweek}`, ttl, () =>
      apiGet(`/event/${gameweek}/live/`)
    );

    const statsByPlayer = new Map();
    for (const el of data?.elements ?? []) {
      const s = el.stats ?? {};
      statsByPlayer.set(el.id, {
        minutes: s.minutes ?? 0,
        goals: s.goals_scored ?? 0,
        assists: s.assists ?? 0,
        saves: s.saves ?? 0,
        yellowCards: s.yellow_cards ?? 0,
        redCards: s.red_cards ?? 0,
        goalsConceded: s.goals_conceded ?? 0,
      });
    }
    return statsByPlayer;
  },

  // Pre-season fallback: the player's official FPL points from the most
  // recent completed season, averaged per gameweek. Real data, one cached
  // request per distinct rostered player.
  async getLastSeasonAveragePoints(playerId) {
    const data = await cachedFplRequest(`fpl:summary:${playerId}`, TTL.elementSummary, () =>
      apiGet(`/element-summary/${playerId}/`)
    );
    const past = data?.history_past ?? [];
    if (!past.length) return 0;
    const lastSeason = past[past.length - 1];
    return Math.round((lastSeason.total_points ?? 0) / SEASON_GAMES);
  },
};

export { TTL as FPL_TTL };
