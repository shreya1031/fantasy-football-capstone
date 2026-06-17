import axios from 'axios';
import { env } from '../config/env.js';
import { cachedRequest } from '../utils/cache.js';
import { AppError } from '../utils/errors.js';

const TTL = {
  leagues: 24 * 60 * 60 * 1000,
  teams: 24 * 60 * 60 * 1000,
  fixturesByDate: 10 * 60 * 1000,
  fixtureById: 30 * 1000,
  standings: 15 * 60 * 1000,
  players: 12 * 60 * 60 * 1000,
  playerStats: 30 * 60 * 1000,
};

const client = axios.create({
  baseURL: `https://${env.API_FOOTBALL_HOST}`,
  headers: {
    'x-apisports-key': env.API_FOOTBALL_KEY,
  },
  timeout: 15000,
});

async function apiGet(path, params = {}) {
  try {
    const response = await client.get(path, { params });
    if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
      throw new AppError('API_FOOTBALL_ERROR', 'External API returned errors', 502, response.data.errors);
    }
    return response.data?.response ?? [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('API_FOOTBALL_UNAVAILABLE', 'Sports data provider unavailable', 502);
  }
}

function mapPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    firstname: player.firstname,
    lastname: player.lastname,
    age: player.age,
    nationality: player.nationality,
    photo: player.photo,
    position: normalizePosition(player.position),
    team: player.team
      ? {
          id: player.team.id,
          name: player.team.name,
          logo: player.team.logo,
        }
      : null,
  };
}

function normalizePosition(position) {
  const map = {
    Goalkeeper: 'GK',
    Defender: 'DEF',
    Midfielder: 'MID',
    Attacker: 'FWD',
    GK: 'GK',
    DEF: 'DEF',
    MID: 'MID',
    FWD: 'FWD',
  };
  return map[position] ?? 'MID';
}

export const sportsData = {
  async getPlayers({ league = env.DEFAULT_LEAGUE_ID, season = env.DEFAULT_SEASON, search = '', page = 1 }) {
    const key = `players:${league}:${season}:${search}:${page}`;
    const data = await cachedRequest(key, TTL.players, () =>
      apiGet('/players', {
        league,
        season,
        search: search || undefined,
        page,
      })
    );

    const players = data.map((entry) => mapPlayer(entry.player));
    return { players, page, total: players.length };
  },

  async getPlayerById(playerId, season = env.DEFAULT_SEASON) {
    const key = `player:${playerId}:${season}`;
    const data = await cachedRequest(key, TTL.players, () =>
      apiGet('/players', { id: playerId, season })
    );
    if (!data.length) return null;
    const entry = data[0];
    return {
      ...mapPlayer(entry.player),
      statistics: entry.statistics ?? [],
    };
  },

  async getFixturesByDate(date, league = env.DEFAULT_LEAGUE_ID, season = env.DEFAULT_SEASON) {
    const key = `fixtures:date:${date}:${league}:${season}`;
    return cachedRequest(key, TTL.fixturesByDate, () =>
      apiGet('/fixtures', { date, league, season })
    );
  },

  async getFixtureById(fixtureId) {
    const key = `fixture:${fixtureId}`;
    const data = await cachedRequest(key, TTL.fixtureById, () =>
      apiGet('/fixtures', { id: fixtureId })
    );
    return data[0] ?? null;
  },

  async getStandings(league = env.DEFAULT_LEAGUE_ID, season = env.DEFAULT_SEASON) {
    const key = `standings:${league}:${season}`;
    const data = await cachedRequest(key, TTL.standings, () =>
      apiGet('/standings', { league, season })
    );
    return data[0]?.league?.standings?.[0] ?? [];
  },

  async getPlayerFixtureStats(playerId, fixtureId) {
    const key = `playerStats:${playerId}:${fixtureId}`;
    const data = await cachedRequest(key, TTL.playerStats, () =>
      apiGet('/fixtures/players', { fixture: fixtureId, id: playerId })
    );

    const teamBlock = data[0]?.players?.find((p) => p.player?.id === Number(playerId));
    const stats = teamBlock?.statistics?.[0];
    if (!stats) return null;

    return {
      minutes: stats.games?.minutes ?? 0,
      goals: stats.goals?.total ?? 0,
      assists: stats.goals?.assists ?? 0,
      saves: stats.goals?.saves ?? 0,
      yellowCards: stats.cards?.yellow ?? 0,
      redCards: stats.cards?.red ?? 0,
      goalsConceded: stats.goals?.conceded ?? 0,
    };
  },

  async getLeagues() {
    const key = 'leagues:all';
    return cachedRequest(key, TTL.leagues, () => apiGet('/leagues'));
  },
};

export { TTL };
