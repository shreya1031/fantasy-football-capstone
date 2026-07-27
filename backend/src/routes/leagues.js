import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createLeague,
  joinLeagueByCode,
  getUserLeagues,
  getLeagueWithMembers,
} from '../services/leagues.js';
import { getLeagueLeaderboard } from '../services/scoring.js';
import { env } from '../config/env.js';
import { getCurrentGameweek } from '../utils/gameweek.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(80),
  season: z.coerce.number().optional(),
  teamId: z.string().optional(),
});

const joinSchema = z.object({
  code: z.string().length(6),
  teamId: z.string().optional(),
});

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const leagues = await getUserLeagues(req.user._id);
    res.json({ leagues });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const league = await createLeague({
      name: req.validatedBody.name,
      ownerId: req.user._id,
      season: req.validatedBody.season ?? env.DEFAULT_SEASON,
      teamId: req.validatedBody.teamId,
    });
    res.status(201).json({ league });
  } catch (error) {
    next(error);
  }
});

router.post('/join', validate(joinSchema), async (req, res, next) => {
  try {
    const result = await joinLeagueByCode({
      code: req.validatedBody.code,
      userId: req.user._id,
      teamId: req.validatedBody.teamId,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await getLeagueWithMembers(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const gameweek = Number(req.query.gw) || getCurrentGameweek();
    const season = Number(req.query.season) || env.DEFAULT_SEASON;
    const leaderboard = await getLeagueLeaderboard(req.params.id, gameweek, season);
    res.json({ gameweek, season, leaderboard });
  } catch (error) {
    next(error);
  }
});

export default router;
