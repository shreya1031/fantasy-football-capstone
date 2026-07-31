import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { League } from '../models/League.js';
import { Membership } from '../models/Membership.js';
import { GameweekScore } from '../models/GameweekScore.js';
import { deleteLeague, removeLeagueMember } from '../services/leagues.js';
import { notFound, forbidden } from '../utils/errors.js';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const [teamCounts, membershipCounts] = await Promise.all([
      Team.aggregate([{ $group: { _id: '$owner', count: { $sum: 1 } } }]),
      Membership.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
    ]);
    const teamsBy = new Map(teamCounts.map((t) => [t._id.toString(), t.count]));
    const leaguesBy = new Map(membershipCounts.map((m) => [m._id.toString(), m.count]));

    res.json({
      users: users.map(({ passwordHash, ...u }) => ({
        ...u,
        teamCount: teamsBy.get(u._id.toString()) ?? 0,
        leagueCount: leaguesBy.get(u._id.toString()) ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Deletes a user and everything they own: teams, memberships, scores, and
// any leagues they created (including those leagues' memberships).
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      throw forbidden('CANNOT_DELETE_SELF', 'You cannot delete your own admin account');
    }
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('USER_NOT_FOUND', 'User not found');

    const ownedLeagues = await League.find({ owner: user._id });
    for (const league of ownedLeagues) {
      await deleteLeague(league._id);
    }

    await GameweekScore.deleteMany({ user: user._id });
    await Membership.deleteMany({ user: user._id });
    await Team.deleteMany({ owner: user._id });
    await user.deleteOne();

    res.json({ message: 'User and all their data deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/leagues', async (_req, res, next) => {
  try {
    const leagues = await League.find().sort({ createdAt: -1 }).populate('owner', 'displayName email').lean();
    const memberships = await Membership.find()
      .populate('user', 'displayName email')
      .populate('teamRef', 'name')
      .lean();

    const membersBy = new Map();
    for (const m of memberships) {
      const key = m.league.toString();
      if (!membersBy.has(key)) membersBy.set(key, []);
      membersBy.get(key).push(m);
    }

    res.json({
      leagues: leagues.map((l) => ({
        ...l,
        members: membersBy.get(l._id.toString()) ?? [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/leagues/:id', async (req, res, next) => {
  try {
    await deleteLeague(req.params.id);
    res.json({ message: 'League deleted' });
  } catch (error) {
    next(error);
  }
});

router.delete('/leagues/:id/members/:membershipId', async (req, res, next) => {
  try {
    await removeLeagueMember(req.params.id, req.params.membershipId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
});

export default router;
