import { GameweekScore } from '../models/GameweekScore.js';
import { sportsData } from './sportsData.js';
import { calculatePlayerPoints, aggregateBreakdown } from '../utils/points.js';
import { getGameweekDates, formatDate } from '../utils/gameweek.js';
import { env } from '../config/env.js';
import { notFound } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { fpl } from './fpl.js';

const inFlightScores = new Map();

function isFixtureFinished(fixture) {
  const status = fixture?.fixture?.status?.short;
  return ['FT', 'AET', 'PEN'].includes(status);
}

async function fetchFixturesForGameweek(gameweek, season) {
  const dates = getGameweekDates(gameweek);
  return sportsData.getScoringFixtures(dates[0], dates[dates.length - 1], season);
}

function zeroEntry(player) {
  return {
    apiPlayerId: player.apiPlayerId,
    playerName: player.name,
    fixtureId: null,
    points: 0,
    breakdown: [],
  };
}

// FPL path: one live request covers every player's stats for the gameweek.
// Before the season kicks off that endpoint is empty, so each player scores
// their real FPL points from last season averaged per gameweek instead.
async function computeTeamScoreFpl(team, gameweek) {
  const fixtures = await fpl.getFixturesForGameweek(gameweek);
  const gameweekFinished = fixtures.length > 0 && fixtures.every(isFixtureFinished);
  const statsMap = await fpl.getGameweekStatsMap(gameweek, { finished: gameweekFinished });

  let playerEntries;
  let isFinal = false;

  if (statsMap.size > 0) {
    playerEntries = team.players.map((player) => {
      const stats = statsMap.get(player.apiPlayerId);
      if (!stats || stats.minutes <= 0) return zeroEntry(player);
      const result = calculatePlayerPoints(stats, player.position, player.isCaptain);
      return {
        apiPlayerId: player.apiPlayerId,
        playerName: player.name,
        fixtureId: null,
        points: result.points,
        breakdown: result.breakdown,
      };
    });
    isFinal = gameweekFinished;
  } else {
    playerEntries = [];
    for (const player of team.players) {
      let avg = 0;
      try {
        avg = await fpl.getLastSeasonAveragePoints(player.apiPlayerId);
      } catch (error) {
        logger.error(`FPL history unavailable for player ${player.apiPlayerId}`, error.message);
      }
      if (avg <= 0) {
        playerEntries.push(zeroEntry(player));
        continue;
      }
      const breakdown = [{ event: 'lastSeasonAvg', points: avg }];
      let points = avg;
      if (player.isCaptain) {
        breakdown.push({ event: 'captainBonus', points: avg });
        points += avg;
      }
      playerEntries.push({
        apiPlayerId: player.apiPlayerId,
        playerName: player.name,
        fixtureId: null,
        points,
        breakdown,
      });
    }
  }

  const totalPoints = playerEntries.reduce((sum, entry) => sum + entry.points, 0);
  return {
    points: totalPoints,
    breakdown: aggregateBreakdown(playerEntries),
    isFinal,
  };
}

async function computeTeamScore(team, gameweek, season) {
  if (fpl.enabled()) {
    return computeTeamScoreFpl(team, gameweek);
  }

  const fixtures = await fetchFixturesForGameweek(gameweek, season);

  // One API request per fixture covers every player in the gameweek; the
  // per-fixture cache is shared across all teams in a league.
  const statsByPlayer = new Map();
  let statsIncomplete = false;
  for (const fixture of fixtures) {
    const fixtureId = fixture.fixture.id;
    let fixtureMap;
    try {
      fixtureMap = await sportsData.getFixturePlayersMap(fixtureId, {
        finished: isFixtureFinished(fixture),
      });
    } catch (error) {
      // Provider hiccup (quota, outage, suspended key): score what we can
      // rather than failing the whole leaderboard. The score is not marked
      // final, so it gets recomputed once the provider recovers.
      logger.error(`Player stats unavailable for fixture ${fixtureId}`, error.message);
      statsIncomplete = true;
      continue;
    }
    for (const [playerId, stats] of fixtureMap) {
      const existing = statsByPlayer.get(playerId);
      if (!existing || (existing.stats.minutes <= 0 && stats.minutes > 0)) {
        statsByPlayer.set(playerId, { stats, fixtureId });
      }
    }
  }

  const playerEntries = team.players.map((player) => {
    const found = statsByPlayer.get(player.apiPlayerId);
    if (!found || found.stats.minutes <= 0) {
      return {
        apiPlayerId: player.apiPlayerId,
        playerName: player.name,
        fixtureId: null,
        points: 0,
        breakdown: [],
      };
    }

    const result = calculatePlayerPoints(found.stats, player.position, player.isCaptain);
    return {
      apiPlayerId: player.apiPlayerId,
      playerName: player.name,
      fixtureId: found.fixtureId,
      points: result.points,
      breakdown: result.breakdown,
    };
  });

  const totalPoints = playerEntries.reduce((sum, entry) => sum + entry.points, 0);
  const allFixturesFinished =
    fixtures.length > 0 && !statsIncomplete && fixtures.every(isFixtureFinished);

  return {
    points: totalPoints,
    breakdown: aggregateBreakdown(playerEntries),
    isFinal: allFixturesFinished,
  };
}

export async function getTeamGameweekScore(team, gameweek, season = env.DEFAULT_SEASON) {
  const cacheKey = `${team._id}:${gameweek}:${season}`;

  const existing = await GameweekScore.findOne({
    team: team._id,
    gameweek,
    season,
  });

  if (existing?.isFinal) {
    return existing;
  }

  if (inFlightScores.has(cacheKey)) {
    return inFlightScores.get(cacheKey);
  }

  const promise = (async () => {
    const computed = await computeTeamScore(team, gameweek, season);

    const score = await GameweekScore.findOneAndUpdate(
      { team: team._id, gameweek, season },
      {
        user: team.owner,
        team: team._id,
        league: team.leagueRef,
        gameweek,
        season,
        points: computed.points,
        breakdown: computed.breakdown,
        isFinal: computed.isFinal,
        computedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return score;
  })();

  inFlightScores.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlightScores.delete(cacheKey);
  }
}

export async function getLeagueLeaderboard(leagueId, gameweek, season = env.DEFAULT_SEASON) {
  const { Membership } = await import('../models/Membership.js');
  const { Team } = await import('../models/Team.js');

  const memberships = await Membership.find({ league: leagueId })
    .populate('user', 'displayName email')
    .populate('teamRef');

  const rows = [];

  for (const membership of memberships) {
    if (!membership.teamRef) continue;
    const score = await getTeamGameweekScore(membership.teamRef, gameweek, season);
    rows.push({
      membershipId: membership._id,
      user: membership.user,
      team: membership.teamRef,
      points: score.points,
      gameweek,
      season,
    });
  }

  rows.sort((a, b) => b.points - a.points);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function getTeamByIdOrThrow(teamId) {
  const { Team } = await import('../models/Team.js');
  const team = await Team.findById(teamId);
  if (!team) throw notFound('TEAM_NOT_FOUND', 'Team not found');
  return team;
}
