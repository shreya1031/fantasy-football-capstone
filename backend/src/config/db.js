import mongoose from 'mongoose';
import dns from 'node:dns/promises';
import { env } from './env.js';
import { logger } from './logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

async function getMongoConnectionTarget(uri) {
  const parsed = new URL(uri);
  const database = parsed.pathname.replace(/^\//, '') || undefined;

  if (parsed.protocol === 'mongodb+srv:') {
    const records = await dns.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
    const hosts = await Promise.all(
      records.map(async (record) => ({
        host: record.name,
        port: record.port,
        ips: await dns.resolve(record.name),
      })),
    );

    return {
      scheme: parsed.protocol.replace(':', ''),
      srvHost: parsed.hostname,
      database,
      hosts,
    };
  }

  return {
    scheme: parsed.protocol.replace(':', ''),
    host: parsed.hostname,
    port: parsed.port || 27017,
    database,
    ips: await dns.resolve(parsed.hostname),
  };
}

export async function connectDB() {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      if (attempt === 0) {
        try {
          logger.info('MongoDB connection target', await getMongoConnectionTarget(env.MONGODB_URI));
        } catch (error) {
          logger.warn('Could not resolve MongoDB connection target', error.message);
        }
      }

      await mongoose.connect(env.MONGODB_URI);
      logger.info('MongoDB connected');
      return mongoose.connection;
    } catch (error) {
      attempt += 1;
      logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, error.message);
      if (attempt >= MAX_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export function isDBReady() {
  return mongoose.connection.readyState === 1;
}
