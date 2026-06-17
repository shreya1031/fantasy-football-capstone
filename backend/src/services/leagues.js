import { League } from '../models/League.js';
import { Membership } from '../models/Membership.js';
import { Team } from '../models/Team.js';
import { conflict, notFound } from '../utils/errors.js';
import { env } from '../config/env.js';

export async function createLeague({ name, ownerId, season = env.DEFAULT_SEASON }) {
  const league = await League.create({
    name,
    owner: ownerId,
    season,
  });

  await Membership.create({
    league: league._id,
    user: ownerId,
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

export async function getLeagueWithMembers(leagueId) {
  const league = await League.findById(leagueId).populate('owner', 'displayName email');
  if (!league) throw notFound('LEAGUE_NOT_FOUND', 'League not found');

  const members = await Membership.find({ league: leagueId })
    .populate('user', 'displayName email')
    .populate('teamRef');

  return { league, members };
}
