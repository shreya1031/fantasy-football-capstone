import { Router } from 'express';
import { z } from 'zod';
import { sportsData } from '../services/sportsData.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

const router = Router();

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  league: z.coerce.number().optional(),
  season: z.coerce.number().optional(),
});

router.get('/', validate(dateSchema, 'query'), async (req, res, next) => {
  try {
    const date = req.validatedQuery.date ?? new Date().toISOString().slice(0, 10);
    const fixtures = await sportsData.getFixturesByDate(
      date,
      req.validatedQuery.league ?? env.DEFAULT_LEAGUE_ID,
      req.validatedQuery.season ?? env.DEFAULT_SEASON
    );
    res.json({ date, fixtures });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const fixture = await sportsData.getFixtureById(req.params.id);
    if (!fixture) {
      return res.status(404).json({
        error: { code: 'FIXTURE_NOT_FOUND', message: 'Fixture not found' },
      });
    }
    res.json({ fixture });
  } catch (error) {
    next(error);
  }
});

export default router;
