import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getTeamGameweekScore, getTeamByIdOrThrow } from '../services/scoring.js';
import { env } from '../config/env.js';
import { getCurrentGameweek } from '../utils/gameweek.js';
import { forbidden } from '../utils/errors.js';

const router = Router();

router.use(authMiddleware);

router.get('/teams/:id', async (req, res, next) => {
  try {
    const team = await getTeamByIdOrThrow(req.params.id);
    if (team.owner.toString() !== req.user._id.toString()) {
      throw forbidden('NOT_OWNER', 'You do not own this team');
    }

    const gameweek = Number(req.query.gw) || getCurrentGameweek();
    const season = Number(req.query.season) || env.DEFAULT_SEASON;
    const score = await getTeamGameweekScore(team, gameweek, season);

    res.json({ team, score, gameweek, season });
  } catch (error) {
    next(error);
  }
});

export default router;
