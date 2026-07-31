import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { unauthorized, AppError } from '../utils/errors.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized();
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user) {
      throw unauthorized('INVALID_TOKEN', 'User not found');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(unauthorized('INVALID_TOKEN', 'Invalid or expired token'));
    }
    return next(error);
  }
}

// Requires authMiddleware to have run first.
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new AppError('ADMIN_ONLY', 'Admin access required', 403));
  }
  return next();
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  return authMiddleware(req, res, next);
}
