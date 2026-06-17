import { Router } from 'express';
import { z } from 'zod';
import { sportsData } from '../services/sportsData.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

const router = Router();

const listSchema = z.object({
  league: z.coerce.number().optional(),
  season: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
});

router.get('/', validate(listSchema, 'query'), async (req, res, next) => {
  try {
    const data = await sportsData.getPlayers({
      league: req.validatedQuery.league ?? env.DEFAULT_LEAGUE_ID,
      season: req.validatedQuery.season ?? env.DEFAULT_SEASON,
      search: req.validatedQuery.search ?? '',
      page: req.validatedQuery.page,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const season = Number(req.query.season) || env.DEFAULT_SEASON;
    const player = await sportsData.getPlayerById(req.params.id, season);
    if (!player) {
      return res.status(404).json({
        error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found' },
      });
    }
    res.json({ player });
  } catch (error) {
    next(error);
  }
});

export default router;
