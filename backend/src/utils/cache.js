import { LRUCache } from 'lru-cache';
import { ApiCache } from '../models/ApiCache.js';

const memoryCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60,
});

const inFlight = new Map();

export async function cachedRequest(key, ttlMs, fetcher) {
  const now = Date.now();

  const memoryHit = memoryCache.get(key);
  if (memoryHit !== undefined) {
    return memoryHit;
  }

  const mongoHit = await ApiCache.findOne({ key, expiresAt: { $gt: new Date(now) } }).lean();
  if (mongoHit) {
    memoryCache.set(key, mongoHit.payload, { ttl: ttlMs });
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
