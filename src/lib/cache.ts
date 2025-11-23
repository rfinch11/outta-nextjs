// Cache utility for Vercel KV (Redis)
// To enable: Install @vercel/kv and set up KV database in Vercel dashboard

// Uncomment when Vercel KV is set up:
// import { kv } from '@vercel/kv';

const CACHE_TTL = 300; // 5 minutes in seconds
const CACHE_ENABLED = false; // Set to true after setting up Vercel KV

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
  if (!CACHE_ENABLED) {
    // Cache disabled, always fetch fresh
    return fetcher();
  }

  // TODO: Uncomment when Vercel KV is set up
  // try {
  //   // Try cache first
  //   const cached = await kv.get<T>(key);
  //   if (cached) {
  //     console.log(`Cache HIT: ${key}`);
  //     return cached;
  //   }
  //
  //   console.log(`Cache MISS: ${key}`);
  // } catch (error) {
  //   console.error('Cache read error:', error);
  // }

  // Cache miss or error, fetch fresh data
  const data = await fetcher();

  // TODO: Uncomment when Vercel KV is set up
  // try {
  //   // Store in cache for next time
  //   await kv.set(key, data, { ex: CACHE_TTL });
  //   console.log(`Cache SET: ${key}`);
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
  if (!CACHE_ENABLED) {
    return;
  }

  // TODO: Uncomment when Vercel KV is set up
  // try {
  //   const keys = await kv.keys(pattern);
  //   if (keys.length > 0) {
  //     await kv.del(...keys);
  //     console.log(`Cache INVALIDATE: ${keys.length} keys matching ${pattern}`);
  //   }
  // } catch (error) {
  //   console.error('Cache invalidation error:', error);
  // }
}

/**
 * Generate cache key for listings
 */
export function getListingsCacheKey(params: Record<string, string | undefined>): string {
  const sortedParams = Object.keys(params)
    .sort()
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

// Setup instructions:
// 1. Install: npm install @vercel/kv
// 2. Go to Vercel dashboard → Storage → Create KV database
// 3. Link database to your project
// 4. Environment variables will be auto-added (KV_REST_API_URL, KV_REST_API_TOKEN)
// 5. Set CACHE_ENABLED = true in this file
// 6. Uncomment all kv-related code above
