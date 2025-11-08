/**
 * Cache Helper Functions
 * Cloudflare Workers KV を使用したAPIキャッシング
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
  prefix?: string; // Cache key prefix
}

/**
 * Generate cache key
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Get cached data
 */
export async function getCache<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  try {
    const cached = await kv.get(key, 'json');
    if (cached) {
      console.log(`[Cache] HIT: ${key}`);
      return cached as T;
    }
    console.log(`[Cache] MISS: ${key}`);
    return null;
  } catch (error) {
    console.error(`[Cache] Error getting cache for ${key}:`, error);
    return null;
  }
}

/**
 * Set cache data
 */
export async function setCache<T>(
  kv: KVNamespace,
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const ttl = options.ttl || 3600; // Default: 1 hour
  
  try {
    await kv.put(key, JSON.stringify(data), {
      expirationTtl: ttl
    });
    console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`[Cache] Error setting cache for ${key}:`, error);
  }
}

/**
 * Delete cache
 */
export async function deleteCache(
  kv: KVNamespace,
  key: string
): Promise<void> {
  try {
    await kv.delete(key);
    console.log(`[Cache] DELETE: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error deleting cache for ${key}:`, error);
  }
}

/**
 * Cache wrapper for API calls
 * 使用例:
 *   const data = await cacheWrapper(
 *     env.CACHE,
 *     'market:tokyo:2024',
 *     () => fetchMarketData(),
 *     { ttl: 86400 } // 24 hours
 *   );
 */
export async function cacheWrapper<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(kv, key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  await setCache(kv, key, data, options);
  
  return data;
}

/**
 * Batch delete cache by prefix
 */
export async function deleteCacheByPrefix(
  kv: KVNamespace,
  prefix: string
): Promise<number> {
  try {
    let deleted = 0;
    let cursor: string | undefined;
    
    do {
      const list = await kv.list({ prefix, cursor });
      
      for (const key of list.keys) {
        await kv.delete(key.name);
        deleted++;
      }
      
      cursor = (list as any).cursor;
    } while (cursor);
    
    console.log(`[Cache] BATCH DELETE: ${prefix}* (${deleted} keys)`);
    return deleted;
  } catch (error) {
    console.error(`[Cache] Error batch deleting cache for ${prefix}:`, error);
    return 0;
  }
}

/**
 * Cache key prefixes (consistency)
 */
export const CACHE_PREFIXES = {
  MARKET: 'market',
  PROPERTY: 'property',
  ANALYSIS: 'analysis',
  REINFOLIB: 'reinfolib',
  ESTAT: 'estat',
  ITANDI: 'itandi',
  LANDPRICE: 'landprice',
  DEMOGRAPHICS: 'demographics',
  OPENAI: 'openai',
  MAPS: 'maps',
} as const;

/**
 * Cache TTL presets (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 3600,    // 1 hour
  LONG: 86400,     // 24 hours
  WEEK: 604800,    // 7 days
} as const;
