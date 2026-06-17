import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import sanitize from 'mongo-sanitize';
import { env } from './config/env.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import leagueRoutes from './routes/leagues.js';
import playerRoutes from './routes/players.js';
import fixtureRoutes from './routes/fixtures.js';
import standingsRoutes from './routes/standings.js';
import scoringRoutes from './routes/scoring.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use((req, _res, next) => {
    if (req.body) req.body = sanitize(req.body);
    next();
  });
  app.use(globalRateLimit);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/leagues', leagueRoutes);
  app.use('/api/players', playerRoutes);
  app.use('/api/fixtures', fixtureRoutes);
  app.use('/api/standings', standingsRoutes);
  app.use('/api/scoring', scoringRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
