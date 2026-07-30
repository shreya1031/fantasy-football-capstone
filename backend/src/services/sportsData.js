import axios from 'axios';
import { env } from '../config/env.js';
import { cachedRequest } from '../utils/cache.js';
import { AppError } from '../utils/errors.js';
import { apiFootball } from './apiFootball.js';
import { fpl } from './fpl.js';

// Adapter for football-data.org v4. Maps its responses into the same shapes
// the app used with API-Football, so routes/scoring/frontend stay unchanged.
//
// The player pool and fantasy-scoring stats come from the provider selected
// by PLAYER_STATS_PROVIDER ('fpl' by default — football-data.org's free tier
// has no player-level match data, so points would always be 0 without a
// second source). Fixture browsing and standings stay on football-data.org.

const TTL = {
  competitions: 24 * 60 * 60 * 1000,
  playerPool: 24 * 60 * 60 * 1000,
  fixturesByDate: 60 * 60 * 1000,
  seasonCalendar: 6 * 60 * 60 * 1000,
  fixtureById: 30 * 1000,
  standings: 15 * 60 * 1000,
  playerStats: 30 * 60 * 1000,
  playerStatsFinished: 7 * 24 * 60 * 60 * 1000,
  apiFailure: 5 * 60 * 1000,
};

const PAGE_SIZE = 20;
const MATCH_MINUTES = 90;

const client = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: {
    'X-Auth-Token': env.FOOTBALL_DATA_KEY,
  },
  timeout: 15000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiGet(path, params = {}, { retryOn429 = true } = {}) {
  try {
    const response = await client.get(path, { params });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Free tier allows 10 requests/minute; the reset header says how long
    // until the counter clears. Wait it out once rather than failing.
    if (status === 429 && retryOn429) {
      const resetSec = Number(error.response.headers?.['x-requestcounter-reset']) || 60;
      if (resetSec <= 65) {
        await sleep((resetSec + 1) * 1000);
        return apiGet(path, params, { retryOn429: false });
      }
    }

    if (status === 429) {
      throw new AppError('FOOTBALL_DATA_RATE_LIMITED', 'Sports data provider rate limit reached, try again shortly', 503);
    }
    if (status === 403) {
      throw new AppError('FOOTBALL_DATA_FORBIDDEN', message ?? 'Resource not available on the current football-data.org plan', 502);
    }
    if (status === 400 || status === 404) {
      throw new AppError('FOOTBALL_DATA_ERROR', message ?? 'External API rejected the request', 502);
    }
    throw new AppError('FOOTBALL_DATA_UNAVAILABLE', 'Sports data provider unavailable', 502);
  }
}

function cachedSportsDataRequest(key, ttlMs, fetcher) {
  return cachedRequest(key, ttlMs, fetcher, { failureTtlMs: TTL.apiFailure });
}

// Squad positions range from coarse ("Defence") to granular ("Centre-Back").
function normalizePosition(position) {
  const p = (position ?? '').toLowerCase();
  if (p.includes('keeper')) return 'GK';
  if (p.includes('back') || p.includes('defen')) return 'DEF';
  if (p.includes('midfield')) return 'MID';
  if (p.includes('winger') || p.includes('forward') || p.includes('striker') || p.includes('offen') || p.includes('attack')) return 'FWD';
  return 'MID';
}

function ageFromDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return undefined;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const STATUS_MAP = {
  SCHEDULED: { short: 'NS', long: 'Not Started' },
  TIMED: { short: 'NS', long: 'Not Started' },
  IN_PLAY: { short: 'LIVE', long: 'In Play' },
  PAUSED: { short: 'HT', long: 'Halftime' },
  FINISHED: { short: 'FT', long: 'Match Finished' },
  SUSPENDED: { short: 'SUSP', long: 'Suspended' },
  POSTPONED: { short: 'PST', long: 'Postponed' },
  CANCELLED: { short: 'CANC', long: 'Cancelled' },
  AWARDED: { short: 'AWD', long: 'Awarded' },
};

function mapTeam(team) {
  if (!team) return null;
  return { id: team.id, name: team.name, logo: team.crest };
}

function mapMatch(match) {
  return {
    fixture: {
      id: match.id,
      date: match.utcDate,
      status: STATUS_MAP[match.status] ?? { short: match.status, long: match.status },
    },
    league: {
      id: match.competition?.id ?? 0,
      name: match.competition?.name ?? env.FOOTBALL_DATA_COMPETITION,
      logo: match.competition?.emblem,
    },
    teams: {
      home: mapTeam(match.homeTeam),
      away: mapTeam(match.awayTeam),
    },
    goals: {
      home: match.score?.fullTime?.home ?? null,
      away: match.score?.fullTime?.away ?? null,
    },
    matchday: match.matchday,
  };
}

function mapMatchEvents(match) {
  const events = [];
  const teamOf = (t) => ({ id: t?.id, name: t?.name });

  for (const goal of match.goals ?? []) {
    events.push({
      time: { elapsed: goal.minute ?? 0 },
      team: teamOf(goal.team),
      player: { id: goal.scorer?.id, name: goal.scorer?.name },
      type: 'Goal',
      detail: goal.type === 'PENALTY' ? 'Penalty' : goal.type === 'OWN' ? 'Own Goal' : 'Normal Goal',
    });
  }
  for (const booking of match.bookings ?? []) {
    events.push({
      time: { elapsed: booking.minute ?? 0 },
      team: teamOf(booking.team),
      player: { id: booking.player?.id, name: booking.player?.name },
      type: 'Card',
      detail: booking.card === 'RED' ? 'Red Card' : booking.card === 'YELLOW_RED' ? 'Second Yellow card' : 'Yellow Card',
    });
  }
  for (const sub of match.substitutions ?? []) {
    events.push({
      time: { elapsed: sub.minute ?? 0 },
      team: teamOf(sub.team),
      player: { id: sub.playerIn?.id, name: sub.playerIn?.name },
      type: 'subst',
      detail: 'Substitution',
    });
  }

  return events.sort((a, b) => a.time.elapsed - b.time.elapsed);
}

// The event stream doesn't include per-player stat lines, so we derive them:
// minutes from lineups + substitutions, goals/assists/cards from events, and
// goals conceded from the final score. Saves are not available on this API.
function deriveMatchPlayerStats(match) {
  const fullTime = match.score?.fullTime ?? {};
  const entries = new Map();
  const clampMinute = (minute) => Math.min(Math.max(minute ?? 0, 0), MATCH_MINUTES);

  const ensure = (playerId, init = {}) => {
    if (playerId == null) return null;
    if (!entries.has(playerId)) {
      entries.set(playerId, {
        onMinute: null,
        offMinute: null,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        conceded: 0,
        ...init,
      });
    }
    return entries.get(playerId);
  };

  const sides = [
    { team: match.homeTeam, conceded: fullTime.away ?? 0 },
    { team: match.awayTeam, conceded: fullTime.home ?? 0 },
  ];

  for (const { team, conceded } of sides) {
    for (const player of team?.lineup ?? []) {
      ensure(player.id, { onMinute: 0, conceded });
    }
    for (const player of team?.bench ?? []) {
      ensure(player.id, { conceded });
    }
  }

  for (const sub of match.substitutions ?? []) {
    const minute = clampMinute(sub.minute);
    const out = entries.get(sub.playerOut?.id);
    if (out) out.offMinute = minute;
    const into = ensure(sub.playerIn?.id);
    if (into) into.onMinute = minute;
  }

  for (const goal of match.goals ?? []) {
    // If lineups were missing, still register the scorer as having played.
    const scorer = ensure(goal.scorer?.id, { onMinute: 0 });
    if (scorer && goal.type !== 'OWN') scorer.goals += 1;
    const assist = ensure(goal.assist?.id, { onMinute: 0 });
    if (assist) assist.assists += 1;
  }

  for (const booking of match.bookings ?? []) {
    const player = ensure(booking.player?.id, { onMinute: 0 });
    if (!player) continue;
    if (booking.card === 'YELLOW') player.yellowCards += 1;
    else player.redCards += 1;
  }

  const statsByPlayer = new Map();
  for (const [playerId, entry] of entries) {
    const minutes = entry.onMinute === null ? 0 : (entry.offMinute ?? MATCH_MINUTES) - entry.onMinute;
    statsByPlayer.set(playerId, {
      minutes: Math.max(minutes, 0),
      goals: entry.goals,
      assists: entry.assists,
      saves: 0,
      yellowCards: entry.yellowCards,
      redCards: entry.redCards,
      goalsConceded: minutes > 0 ? entry.conceded : 0,
    });
  }
  return statsByPlayer;
}

// All Premier League players, built from the 20 squad lists. Cached for a day,
// so browsing and searching players costs zero API requests after the first hit.
async function getPlayerPool(season) {
  const competition = env.FOOTBALL_DATA_COMPETITION;
  const key = `playerPool:${competition}:${season}`;
  return cachedSportsDataRequest(key, TTL.playerPool, async () => {
    const data = await apiGet(`/competitions/${competition}/teams`, { season });
    const players = [];
    for (const team of data.teams ?? []) {
      const teamInfo = mapTeam(team);
      for (const member of team.squad ?? []) {
        players.push({
          id: member.id,
          name: member.name,
          age: ageFromDateOfBirth(member.dateOfBirth),
          nationality: member.nationality,
          photo: null,
          position: normalizePosition(member.position),
          team: teamInfo,
        });
      }
    }
    players.sort((a, b) => (a.team?.name ?? '').localeCompare(b.team?.name ?? '') || a.name.localeCompare(b.name));
    return players;
  });
}

async function getRawMatch(fixtureId, ttlMs) {
  const key = `matchDetail:${fixtureId}`;
  return cachedSportsDataRequest(key, ttlMs, () => apiGet(`/matches/${fixtureId}`));
}

// Every match of the current season in one cached request.
async function getSeasonCalendar() {
  const competition = env.FOOTBALL_DATA_COMPETITION;
  const key = `fixtures:seasonCalendar:${competition}`;
  return cachedSportsDataRequest(key, TTL.seasonCalendar, () =>
    apiGet(`/competitions/${competition}/matches`)
  );
}

function resolvePlayerPool(season) {
  if (fpl.enabled()) return fpl.getPlayerPool();
  if (apiFootball.enabled()) return apiFootball.getPlayerPool(season);
  return getPlayerPool(season);
}

export const sportsData = {
  async getPlayers({ season = env.DEFAULT_SEASON, search = '', page = 1 } = {}) {
    const pool = await resolvePlayerPool(season);
    const term = search.trim().toLowerCase();
    const filtered = term
      ? pool.filter(
          (p) => p.name.toLowerCase().includes(term) || (p.team?.name ?? '').toLowerCase().includes(term)
        )
      : pool;

    const start = (page - 1) * PAGE_SIZE;
    return {
      players: filtered.slice(start, start + PAGE_SIZE),
      page,
      total: filtered.length,
    };
  },

  async getPlayerById(playerId, season = env.DEFAULT_SEASON) {
    const pool = await resolvePlayerPool(season);
    const player = pool.find((p) => p.id === Number(playerId));
    if (!player) return null;
    return { ...player, statistics: [] };
  },

  async getFixturesByDate(date, _league, _season) {
    return this.getFixturesByRange(date, date);
  },

  async getFixturesByRange(dateFrom, dateTo) {
    const competition = env.FOOTBALL_DATA_COMPETITION;
    const key = `fixtures:range:${competition}:${dateFrom}:${dateTo}`;
    const data = await cachedSportsDataRequest(key, TTL.fixturesByDate, () =>
      apiGet(`/competitions/${competition}/matches`, { dateFrom, dateTo })
    );
    return (data.matches ?? []).map(mapMatch);
  },

  // Smart default for the fixtures page: the requested date if it has
  // matches, otherwise the nearest matchday (upcoming preferred, else the
  // most recent past one). Uses the season calendar — one cached request.
  async getNearestMatchday(fromDate) {
    const data = await getSeasonCalendar();

    const byDate = new Map();
    for (const match of data.matches ?? []) {
      const day = (match.utcDate ?? '').slice(0, 10);
      if (!day) continue;
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day).push(mapMatch(match));
    }
    if (!byDate.size) return { date: fromDate, fixtures: [] };

    const dates = [...byDate.keys()].sort();
    const chosen = byDate.has(fromDate)
      ? fromDate
      : (dates.find((d) => d > fromDate) ?? dates[dates.length - 1]);
    return { date: chosen, fixtures: byDate.get(chosen) };
  },

  // The whole season's schedule — every match, every round — from the
  // cached calendar.
  async getSeasonSchedule() {
    const data = await getSeasonCalendar();
    return (data.matches ?? [])
      .filter((m) => m.utcDate)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .map(mapMatch);
  },

  // The next `limit` matches from now on (in-play matches included), with
  // kickoff time, round number, teams, and crests.
  async getUpcomingFixtures(limit = 10) {
    const data = await getSeasonCalendar();
    const includeFrom = Date.now() - 3 * 60 * 60 * 1000;
    return (data.matches ?? [])
      .filter(
        (m) =>
          m.utcDate &&
          m.status !== 'FINISHED' &&
          new Date(m.utcDate).getTime() >= includeFrom
      )
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, limit)
      .map(mapMatch);
  },

  async getFixtureById(fixtureId) {
    const match = await getRawMatch(fixtureId, TTL.fixtureById);
    if (!match?.id) return null;
    return { ...mapMatch(match), events: mapMatchEvents(match) };
  },

  async getStandings(_league = env.DEFAULT_LEAGUE_ID, season = env.DEFAULT_SEASON) {
    const competition = env.FOOTBALL_DATA_COMPETITION;
    const key = `standings:${competition}:${season}`;
    const data = await cachedSportsDataRequest(key, TTL.standings, () =>
      apiGet(`/competitions/${competition}/standings`, { season })
    );

    const table = data.standings?.find((s) => s.type === 'TOTAL')?.table ?? [];
    return table.map((row) => ({
      rank: row.position,
      team: mapTeam(row.team),
      points: row.points,
      goalsDiff: row.goalDifference,
      all: {
        played: row.playedGames,
        win: row.won,
        draw: row.draw,
        lose: row.lost,
        goals: { for: row.goalsFor, against: row.goalsAgainst },
      },
      form: row.form ?? undefined,
    }));
  },

  // Fixtures used for score computation. With API-Football enabled these come
  // from it directly so fixture IDs line up with its player-stats endpoint.
  async getScoringFixtures(dateFrom, dateTo, season = env.DEFAULT_SEASON) {
    if (apiFootball.enabled()) {
      return apiFootball.getFixturesForRange(dateFrom, dateTo, season);
    }
    return this.getFixturesByRange(dateFrom, dateTo);
  },

  // One request returns the full match detail; stats for every player are
  // derived from it. Finished fixtures never change, so they cache for a week.
  async getFixturePlayersMap(fixtureId, { finished = false } = {}) {
    if (apiFootball.enabled()) {
      return apiFootball.getFixturePlayersMap(fixtureId, { finished });
    }
    const ttl = finished ? TTL.playerStatsFinished : TTL.playerStats;
    const match = await getRawMatch(fixtureId, ttl);
    return deriveMatchPlayerStats(match);
  },

  async getLeagues() {
    const key = 'competitions:all';
    const data = await cachedSportsDataRequest(key, TTL.competitions, () => apiGet('/competitions'));
    return (data.competitions ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      logo: c.emblem,
      area: c.area?.name,
    }));
  },
};

export { TTL, deriveMatchPlayerStats, normalizePosition };
