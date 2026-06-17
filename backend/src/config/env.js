import dotenv from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  API_FOOTBALL_KEY: z.string().min(1),
  API_FOOTBALL_HOST: z.string().default('v3.football.api-sports.io'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DEFAULT_LEAGUE_ID: z.coerce.number().default(39),
  DEFAULT_SEASON: z.coerce.number().default(2024),
  SEASON_START_DATE: z.string().default('2024-08-16'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
