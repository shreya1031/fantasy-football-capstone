import { cachedRequest, clearCache, getInFlightCount } from '../src/utils/cache.js';

describe('Cache single-flight', () => {
  beforeEach(() => {
    clearCache();
  });

  it('deduplicates concurrent requests', async () => {
    let fetchCount = 0;

    const fetcher = async () => {
      fetchCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { value: 'payload' };
    };

    const results = await Promise.all([
      cachedRequest('test-key', 1000, fetcher),
      cachedRequest('test-key', 1000, fetcher),
      cachedRequest('test-key', 1000, fetcher),
    ]);

    expect(fetchCount).toBe(1);
    expect(results).toEqual([
      { value: 'payload' },
      { value: 'payload' },
      { value: 'payload' },
    ]);
    expect(getInFlightCount()).toBe(0);
  });

  it('returns cached value on subsequent calls', async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      return { n: 42 };
    };

    await cachedRequest('cached-key', 5000, fetcher);
    await cachedRequest('cached-key', 5000, fetcher);

    expect(fetchCount).toBe(1);
  });
});
