import { Router } from 'express';
import { z } from 'zod';
import { Team, FORMATIONS, POSITIONS } from '../models/Team.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { forbidden, notFound } from '../utils/errors.js';

const router = Router();

const playerSchema = z.object({
  apiPlayerId: z.number().int().positive(),
  name: z.string().min(1),
  position: z.enum(POSITIONS),
  teamId: z.number().int().optional(),
  teamName: z.string().optional(),
  photo: z.string().nullish(),
  isCaptain: z.boolean().default(false),
});

const teamBodySchema = z.object({
  name: z.string().min(2).max(60),
  formation: z.enum(FORMATIONS).default('4-4-2'),
  players: z.array(playerSchema).length(11),
});

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json({ teams });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) throw notFound('TEAM_NOT_FOUND', 'Team not found');
    if (team.owner.toString() !== req.user._id.toString()) {
      throw forbidden('NOT_OWNER', 'You do not own this team');
    }
    res.json({ team });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(teamBodySchema), async (req, res, next) => {
  try {
    const team = await Team.create({
      ...req.validatedBody,
      owner: req.user._id,
    });
    res.status(201).json({ team });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validate(teamBodySchema), async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) throw notFound('TEAM_NOT_FOUND', 'Team not found');
    if (team.owner.toString() !== req.user._id.toString()) {
      throw forbidden('NOT_OWNER', 'You do not own this team');
    }

    team.name = req.validatedBody.name;
    team.formation = req.validatedBody.formation;
    team.players = req.validatedBody.players;
    await team.save();

    res.json({ team });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) throw notFound('TEAM_NOT_FOUND', 'Team not found');
    if (team.owner.toString() !== req.user._id.toString()) {
      throw forbidden('NOT_OWNER', 'You do not own this team');
    }
    await team.deleteOne();
    res.json({ message: 'Team deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
