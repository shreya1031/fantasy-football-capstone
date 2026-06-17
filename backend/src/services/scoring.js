import { GameweekScore } from '../models/GameweekScore.js';
import { sportsData } from './sportsData.js';
import { calculatePlayerPoints, aggregateBreakdown } from '../utils/points.js';
import { getGameweekDates, formatDate } from '../utils/gameweek.js';
import { env } from '../config/env.js';
import { notFound } from '../utils/errors.js';

const inFlightScores = new Map();

function isFixtureFinished(fixture) {
  const status = fixture?.fixture?.status?.short;
  return ['FT', 'AET', 'PEN'].includes(status);
}

async function fetchFixturesForGameweek(gameweek) {
  const dates = getGameweekDates(gameweek);
  const fixtures = [];

  for (const date of dates) {
    const dayFixtures = await sportsData.getFixturesByDate(date);
    fixtures.push(...dayFixtures);
  }

  return fixtures;
}

async function computeTeamScore(team, gameweek, season) {
  const fixtures = await fetchFixturesForGameweek(gameweek);
  const playerEntries = [];

  for (const player of team.players) {
    let matchedFixture = null;
    let stats = null;

    for (const fixture of fixtures) {
      const homePlayers = fixture.lineups?.flatMap((l) => l.startXI?.map((x) => x.player?.id) ?? []) ?? [];
      const fixturePlayerStats = await sportsData.getPlayerFixtureStats(player.apiPlayerId, fixture.fixture.id);

      if (fixturePlayerStats && fixturePlayerStats.minutes > 0) {
        matchedFixture = fixture;
        stats = fixturePlayerStats;
        break;
      }

      if (homePlayers.includes(player.apiPlayerId)) {
        matchedFixture = fixture;
      }
    }

    if (!stats && matchedFixture) {
      stats = await sportsData.getPlayerFixtureStats(player.apiPlayerId, matchedFixture.fixture.id);
    }

    if (!stats) {
      playerEntries.push({
        apiPlayerId: player.apiPlayerId,
        playerName: player.name,
        fixtureId: null,
        points: 0,
        breakdown: [],
      });
      continue;
    }

    const result = calculatePlayerPoints(stats, player.position, player.isCaptain);
    playerEntries.push({
      apiPlayerId: player.apiPlayerId,
      playerName: player.name,
      fixtureId: matchedFixture?.fixture?.id ?? null,
      points: result.points,
      breakdown: result.breakdown,
    });
  }

  const totalPoints = playerEntries.reduce((sum, entry) => sum + entry.points, 0);
  const allFixturesFinished = fixtures.length > 0 && fixtures.every(isFixtureFinished);

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
