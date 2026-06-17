import { Router } from 'express';
import { z } from 'zod';
import { sportsData } from '../services/sportsData.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

const router = Router();

const querySchema = z.object({
  league: z.coerce.number().optional(),
  season: z.coerce.number().optional(),
});

router.get('/', validate(querySchema, 'query'), async (req, res, next) => {
  try {
    const standings = await sportsData.getStandings(
      req.validatedQuery.league ?? env.DEFAULT_LEAGUE_ID,
      req.validatedQuery.season ?? env.DEFAULT_SEASON
    );
    res.json({ standings });
  } catch (error) {
    next(error);
  }
});

export default router;
