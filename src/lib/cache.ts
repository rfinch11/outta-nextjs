// Cache utility for Vercel KV (Redis)
//
// NOTE: Caching is currently DISABLED
// The REDIS_URL provided by Vercel uses TCP protocol which doesn't work
// with serverless functions. To enable caching, we need Upstash Redis REST API.
//
// To enable caching in the future:
// 1. Set up Upstash Redis (https://upstash.com)
// 2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to env vars
// 3. Uncomment the Redis import and initialization below
// 4. Set CACHE_ENABLED = true

// import { Redis } from '@upstash/redis';
// const kv = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CACHE_TTL = 300; // 5 minutes in seconds (will be used when caching is enabled)
const CACHE_ENABLED = false; // DISABLED - see note above

/**
 * Get cached data or fetch fresh data if cache miss
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data
 * @returns Cached or fresh data
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Caching is currently disabled - always fetch fresh data
  if (!CACHE_ENABLED) {
    return fetcher();
  }

  // NOTE: Redis caching code removed - uncomment when REST API is available
  // try {
  //   const cached = await kv.get<T>(key);
  //   if (cached !== null) {
  //     console.log(`✅ Cache HIT: ${key}`);
  //     return cached;
  //   }
  //   console.log(`❌ Cache MISS: ${key}`);
  // } catch (error) {
  //   console.error('Cache read error:', error);
  // }

  const data = await fetcher();

  // NOTE: Redis caching code removed - uncomment when REST API is available
  // try {
  //   await kv.set(key, data, { ex: CACHE_TTL });
  //   console.log(`💾 Cache SET: ${key} (TTL: ${CACHE_TTL}s)`);
  // } catch (error) {
  //   console.error('Cache write error:', error);
  // }

  return data;
}

/**
 * Invalidate cache entries matching a pattern
 * @param pattern - Key pattern to match (e.g., "listings:*")
 */
export async function invalidateCache(pattern: string): Promise<void> {
  // Caching is currently disabled - nothing to invalidate
  if (!CACHE_ENABLED) {
    return;
  }

  // NOTE: Redis cache invalidation code removed - uncomment when REST API is available
  console.log(`Cache invalidation skipped (caching disabled): ${pattern}`);
}

/**
 * Generate cache key for listings
 */
export function getListingsCacheKey(params: Record<string, string | undefined>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .filter((key) => params[key] !== undefined)
    .map((key) => `${key}:${params[key]}`)
    .join('|');
  return `listings:${sortedParams}`;
}

/**
 * Generate cache key for search
 */
export function getSearchCacheKey(query: string, type?: string): string {
  return `search:${type || 'all'}:${query}`;
}
