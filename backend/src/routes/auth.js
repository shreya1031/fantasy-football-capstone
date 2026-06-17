import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware, signAccessToken, signRefreshToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { conflict, unauthorized } from '../utils/errors.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function authResponse(user, res, statusCode = 200) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.status(statusCode).json({
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
    accessToken,
  });
}

router.post('/register', authRateLimit, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.validatedBody;
    const existing = await User.findOne({ email });
    if (existing) throw conflict('EMAIL_IN_USE', 'Email already registered');

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email, passwordHash, displayName });
    return authResponse(user, res, 201);
  } catch (error) {
    return next(error);
  }
});

router.post('/login', authRateLimit, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }
    return authResponse(user, res);
  } catch (error) {
    return next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw unauthorized('NO_REFRESH_TOKEN', 'Refresh token missing');

    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw unauthorized('INVALID_TOKEN', 'User not found');

    return authResponse(user, res);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(unauthorized('INVALID_TOKEN', 'Invalid refresh token'));
    }
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
    },
  });
});

export default router;
