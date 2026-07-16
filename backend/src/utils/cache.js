import { LRUCache } from 'lru-cache';
import { ApiCache } from '../models/ApiCache.js';
import { AppError } from './errors.js';

const memoryCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60,
});

const inFlight = new Map();
const CACHED_ERROR_TYPE = 'cached-error';

function isCachedError(payload) {
  return payload?.cacheType === CACHED_ERROR_TYPE && payload.error;
}

function throwCachedError(payload) {
  const { code, message, statusCode, details } = payload.error;
  throw new AppError(code, message, statusCode, details);
}

function toCachedError(error) {
  return {
    cacheType: CACHED_ERROR_TYPE,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    },
  };
}

export async function cachedRequest(key, ttlMs, fetcher, options = {}) {
  const { failureTtlMs = 0, shouldCacheError = (error) => error instanceof AppError } = options;
  const now = Date.now();

  const memoryHit = memoryCache.get(key);
  if (memoryHit !== undefined) {
    if (isCachedError(memoryHit)) throwCachedError(memoryHit);
    return memoryHit;
  }

  const mongoHit = await ApiCache.findOne({ key, expiresAt: { $gt: new Date(now) } }).lean();
  if (mongoHit) {
    const remainingTtl = Math.max(0, mongoHit.expiresAt.getTime() - now);
    memoryCache.set(key, mongoHit.payload, { ttl: remainingTtl || ttlMs });
    if (isCachedError(mongoHit.payload)) throwCachedError(mongoHit.payload);
    return mongoHit.payload;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const payload = await fetcher();
      memoryCache.set(key, payload, { ttl: ttlMs });

      await ApiCache.findOneAndUpdate(
        { key },
        {
          key,
          payload,
          expiresAt: new Date(now + ttlMs),
        },
        { upsert: true, returnDocument: 'after' }
      );

      return payload;
    } catch (error) {
      if (failureTtlMs > 0 && shouldCacheError(error)) {
        const payload = toCachedError(error);
        memoryCache.set(key, payload, { ttl: failureTtlMs });

        await ApiCache.findOneAndUpdate(
          { key },
          {
            key,
            payload,
            expiresAt: new Date(now + failureTtlMs),
          },
          { upsert: true, returnDocument: 'after' }
        );
      }

      throw error;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function clearCache() {
  memoryCache.clear();
  inFlight.clear();
}

export function getInFlightCount() {
  return inFlight.size;
}
