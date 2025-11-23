// Cache utility for Vercel KV (Redis)
import { kv } from '@vercel/kv';

const CACHE_TTL = 300; // 5 minutes in seconds
const CACHE_ENABLED = true; // Caching is now enabled!

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

  try {
    // Try cache first
    const cached = await kv.get<T>(key);
    if (cached !== null) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached;
    }

    console.log(`❌ Cache MISS: ${key}`);
  } catch (error) {
    console.error('Cache read error:', error);
  }

  // Cache miss or error, fetch fresh data
  const data = await fetcher();

  try {
    // Store in cache for next time
    await kv.set(key, data, { ex: CACHE_TTL });
    console.log(`💾 Cache SET: ${key} (TTL: ${CACHE_TTL}s)`);
  } catch (error) {
    console.error('Cache write error:', error);
  }

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

  try {
    const keys = await kv.keys(pattern);
    if (keys.length > 0) {
      await kv.del(...keys);
      console.log(`🗑️  Cache INVALIDATE: ${keys.length} keys matching ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
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
