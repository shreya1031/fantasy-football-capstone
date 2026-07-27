import axios from 'axios';
import { env } from '../config/env.js';
import { cachedRequest } from '../utils/cache.js';
import { AppError } from '../utils/errors.js';
import { ApiQuota } from '../models/ApiQuota.js';

// Secondary provider: API-Football (v3.football.api-sports.io).
// Used ONLY when API_FOOTBALL_KEY is set, and only for the data the
// football-data.org free tier cannot provide: the player pool (with photos
// and stable player IDs) and per-fixture player statistics for scoring.
//
// Free plan limits: 100 requests/day and seasons 2021-2023 only. Every call
// goes through a persistent daily budget so the account can't get suspended
// again: one request per fixture covers every player in the match, and
// finished-fixture data is cached long-term so it is only ever fetched once.

const TTL = {
  playerPool: 7 * 24 * 60 * 60 * 1000,
  fixturesUpcoming: 60 * 60 * 1000,
  fixturesPast: 30 * 24 * 60 * 60 * 1000,
  playerStatsLive: 30 * 60 * 1000,
  playerStatsFinished: 90 * 24 * 60 * 60 * 1000,
  apiFailure: 5 * 60 * 1000,
};

const client = axios.create({
  baseURL: `https://${env.API_FOOTBALL_HOST}`,
  headers: {
    'x-apisports-key': env.API_FOOTBALL_KEY ?? '',
  },
  timeout: 15000,
});

async function consumeQuota() {
  const today = new Date().toISOString().slice(0, 10);
  const doc = await ApiQuota.findOneAndUpdate(
    { provider: 'api-football', date: today },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  if (doc.count > env.API_FOOTBALL_DAILY_LIMIT) {
    throw new AppError(
      'API_FOOTBALL_QUOTA',
      `Daily API-Football budget (${env.API_FOOTBALL_DAILY_LIMIT}) exhausted, try again tomorrow`,
      503
    );
  }
}

async function apiGet(path, params = {}) {
  await consumeQuota();
  try {
    const response = await client.get(path, { params });
    // API-Football reports problems (bad key, suspended account, plan limits)
    // inside a 200 response's `errors` object rather than via HTTP status.
    const errors = response.data?.errors;
    if (errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0)) {
      throw new AppError('API_FOOTBALL_ERROR', 'API-Football returned errors', 502, errors);
    }
    return response.data?.response ?? [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('API_FOOTBALL_UNAVAILABLE', 'Sports data provider unavailable', 502);
  }
}

function cachedApiFootballRequest(key, ttlMs, fetcher) {
  return cachedRequest(key, ttlMs, fetcher, { failureTtlMs: TTL.apiFailure });
}

const POSITION_MAP = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Attacker: 'FWD',
};

function isPastDate(dateStr, graceDays = 2) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - graceDays);
  return new Date(dateStr) < cutoff;
}

export const apiFootball = {
  enabled() {
    return env.PLAYER_STATS_PROVIDER === 'api-football' && Boolean(env.API_FOOTBALL_KEY);
  },

  // Full player pool from the 20 squad lists: 21 requests total (1 team list
  // + 1 per squad), then cached for a week.
  async getPlayerPool(season = env.DEFAULT_SEASON, league = env.DEFAULT_LEAGUE_ID) {
    const key = `af:playerPool:${league}:${season}`;
    return cachedApiFootballRequest(key, TTL.playerPool, async () => {
      const teams = await apiGet('/teams', { league, season });
      const players = [];
      for (const entry of teams) {
        const teamInfo = { id: entry.team.id, name: entry.team.name, logo: entry.team.logo };
        const squad = await apiGet('/players/squads', { team: entry.team.id });
        for (const member of squad[0]?.players ?? []) {
          players.push({
            id: member.id,
            name: member.name,
            age: member.age,
            nationality: undefined,
            photo: member.photo ?? null,
            position: POSITION_MAP[member.position] ?? 'MID',
            team: teamInfo,
          });
        }
      }
      players.sort((a, b) => (a.team?.name ?? '').localeCompare(b.team?.name ?? '') || a.name.localeCompare(b.name));
      return players;
    });
  },

  // One request covers the whole gameweek's fixture list.
  async getFixturesForRange(dateFrom, dateTo, season = env.DEFAULT_SEASON, league = env.DEFAULT_LEAGUE_ID) {
    const key = `af:fixtures:${league}:${season}:${dateFrom}:${dateTo}`;
    const ttl = isPastDate(dateTo) ? TTL.fixturesPast : TTL.fixturesUpcoming;
    const data = await cachedApiFootballRequest(key, ttl, () =>
      apiGet('/fixtures', { league, season, from: dateFrom, to: dateTo })
    );
    // API-Football's shape already matches the app's fixture shape.
    return data.map((item) => ({
      fixture: item.fixture,
      league: item.league,
      teams: item.teams,
      goals: item.goals,
    }));
  },

  // One request returns statistics for EVERY player in the fixture. Finished
  // fixtures never change, so they are fetched once and cached for months.
  async getFixturePlayersMap(fixtureId, { finished = false } = {}) {
    const key = `af:fixturePlayers:${fixtureId}`;
    const ttl = finished ? TTL.playerStatsFinished : TTL.playerStatsLive;
    const data = await cachedApiFootballRequest(key, ttl, () =>
      apiGet('/fixtures/players', { fixture: fixtureId })
    );

    const statsByPlayer = new Map();
    for (const teamBlock of data) {
      for (const entry of teamBlock.players ?? []) {
        const stats = entry.statistics?.[0];
        if (!entry.player?.id || !stats) continue;
        statsByPlayer.set(entry.player.id, {
          minutes: stats.games?.minutes ?? 0,
          goals: stats.goals?.total ?? 0,
          assists: stats.goals?.assists ?? 0,
          saves: stats.goals?.saves ?? 0,
          yellowCards: stats.cards?.yellow ?? 0,
          redCards: stats.cards?.red ?? 0,
          goalsConceded: stats.goals?.conceded ?? 0,
        });
      }
    }
    return statsByPlayer;
  },
};

export { TTL as API_FOOTBALL_TTL };
