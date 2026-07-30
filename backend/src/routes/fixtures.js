import { Router } from 'express';
import { z } from 'zod';
import { sportsData } from '../services/sportsData.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  league: z.coerce.number().optional(),
  season: z.coerce.number().optional(),
});

router.get('/', validate(dateSchema, 'query'), async (req, res, next) => {
  try {
    // No explicit date: show the nearest matchday instead of a potentially
    // empty "today" (off-season, international breaks, midweek gaps).
    if (!req.validatedQuery.date) {
      const today = new Date().toISOString().slice(0, 10);
      const nearest = await sportsData.getNearestMatchday(today);
      return res.json(nearest);
    }

    const date = req.validatedQuery.date;
    const fixtures = await sportsData.getFixturesByDate(
      date,
      req.validatedQuery.league,
      req.validatedQuery.season
    );
    res.json({ date, fixtures });
  } catch (error) {
    next(error);
  }
});

const upcomingSchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
});

router.get('/upcoming', validate(upcomingSchema, 'query'), async (req, res, next) => {
  try {
    const fixtures = await sportsData.getUpcomingFixtures(req.validatedQuery.limit);
    res.json({ fixtures });
  } catch (error) {
    next(error);
  }
});

router.get('/schedule', async (req, res, next) => {
  try {
    const fixtures = await sportsData.getSeasonSchedule();
    res.json({ fixtures });
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
