import { League } from '../models/League.js';
import { Membership } from '../models/Membership.js';
import { Team } from '../models/Team.js';
import { conflict, notFound } from '../utils/errors.js';
import { env } from '../config/env.js';

export async function createLeague({ name, ownerId, season = env.DEFAULT_SEASON, teamId }) {
  // Attach the creator's team so they appear on their own leaderboard.
  // Fall back to their most recent team when no teamId is passed.
  let team = null;
  if (teamId) {
    team = await Team.findOne({ _id: teamId, owner: ownerId });
    if (!team) throw notFound('TEAM_NOT_FOUND', 'Team not found');
  } else {
    team = await Team.findOne({ owner: ownerId }).sort({ updatedAt: -1 });
  }

  const league = await League.create({
    name,
    owner: ownerId,
    season,
  });

  if (team) {
    team.leagueRef = league._id;
    await team.save();
  }

  await Membership.create({
    league: league._id,
    user: ownerId,
    teamRef: team?._id,
  });

  return league;
}

export async function joinLeagueByCode({ code, userId, teamId }) {
  const league = await League.findOne({ code: code.toUpperCase() });
  if (!league) throw notFound('LEAGUE_NOT_FOUND', 'League not found');

  const existing = await Membership.findOne({ league: league._id, user: userId });
  if (existing) throw conflict('ALREADY_MEMBER', 'You are already in this league');

  if (teamId) {
    const team = await Team.findOne({ _id: teamId, owner: userId });
    if (!team) throw notFound('TEAM_NOT_FOUND', 'Team not found');
    team.leagueRef = league._id;
    await team.save();
  }

  const membership = await Membership.create({
    league: league._id,
    user: userId,
    teamRef: teamId,
  });

  return { league, membership };
}

export async function getUserLeagues(userId) {
  const memberships = await Membership.find({ user: userId })
    .populate('league')
    .populate('teamRef')
    .sort({ joinedAt: -1 });

  return memberships;
}

// Deletes a league along with its memberships, and detaches member teams.
export async function deleteLeague(leagueId) {
  const league = await League.findById(leagueId);
  if (!league) throw notFound('LEAGUE_NOT_FOUND', 'League not found');

  await Team.updateMany({ leagueRef: league._id }, { $unset: { leagueRef: 1 } });
  await Membership.deleteMany({ league: league._id });
  await league.deleteOne();
  return league;
}

// Removes one member from a league and detaches their team.
export async function removeLeagueMember(leagueId, membershipId) {
  const membership = await Membership.findOne({ _id: membershipId, league: leagueId });
  if (!membership) throw notFound('MEMBER_NOT_FOUND', 'League member not found');

  if (membership.teamRef) {
    await Team.updateOne(
      { _id: membership.teamRef, leagueRef: leagueId },
      { $unset: { leagueRef: 1 } }
    );
  }
  await membership.deleteOne();
  return membership;
}

export async function getLeagueWithMembers(leagueId) {
  const league = await League.findById(leagueId).populate('owner', 'displayName email');
  if (!league) throw notFound('LEAGUE_NOT_FOUND', 'League not found');

  const members = await Membership.find({ league: leagueId })
    .populate('user', 'displayName email')
    .populate('teamRef');

  return { league, members };
}
