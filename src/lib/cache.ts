/**
 * Caching utilities for Cloudflare Workers
 * 
 * Implements caching strategies for API responses and static data
 * Uses Cloudflare Cache API for edge caching
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  vary?: string[]; // Vary headers
  swr?: number; // Stale-while-revalidate in seconds
}

/**
 * Generate cache key from request
 */
export function generateCacheKey(request: Request, customKey?: string): string {
  if (customKey) {
    return `cache:${customKey}`;
  }
  const url = new URL(request.url);
  return `cache:${url.pathname}${url.search}`;
}

/**
 * Get cached response
 */
export async function getCachedResponse(
  request: Request,
  options: CacheOptions = {}
): Promise<Response | null> {
  try {
    const cache = caches.default;
    
    // Use request URL directly for cache lookup
    const cacheRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
    });
    
    const cachedResponse = await cache.match(cacheRequest);
    
    if (!cachedResponse) {
      return null;
    }
    
    // Check if cache is still valid
    const cachedAt = cachedResponse.headers.get('X-Cached-At');
    const ttl = options.ttl || 300; // Default 5 minutes
    
    if (cachedAt) {
      const age = (Date.now() - parseInt(cachedAt)) / 1000;
      if (age > ttl) {
        // Cache expired
        await cache.delete(cacheRequest);
        return null;
      }
    }
    
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: {
        ...Object.fromEntries(cachedResponse.headers),
        'X-Cache': 'HIT',
        'X-Cache-Age': cachedAt ? String(Math.floor((Date.now() - parseInt(cachedAt)) / 1000)) : '0',
      },
    });
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Store response in cache
 */
export async function setCachedResponse(
  request: Request,
  response: Response,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const cache = caches.default;
    
    // Use request URL directly as cache key (must be full URL)
    const cacheRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
    });
    
    // Clone response to avoid consuming the body
    const responseToCache = response.clone();
    
    // Add cache metadata headers
    const headers = new Headers(responseToCache.headers);
    headers.set('X-Cached-At', String(Date.now()));
    headers.set('X-Cache', 'MISS');
    
    if (options.ttl) {
      headers.set('Cache-Control', `public, max-age=${options.ttl}`);
    }
    
    if (options.swr) {
      const currentCacheControl = headers.get('Cache-Control') || '';
      headers.set('Cache-Control', `${currentCacheControl}, stale-while-revalidate=${options.swr}`);
    }
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers,
    });
    
    await cache.put(cacheRequest, cachedResponse);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Invalidate cache for a specific key or pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const cache = caches.default;
    // Note: Cloudflare Cache API doesn't support pattern matching
    // This is a placeholder for when using KV for cache keys
    await cache.delete(pattern);
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

/**
 * Cache middleware for Hono
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  return async (c: any, next: any) => {
    const request = c.req.raw;
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next();
    }
    
    // Check cache
    const cachedResponse = await getCachedResponse(request, options);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Execute request
    await next();
    
    // Cache response if successful
    if (c.res && c.res.status === 200) {
      try {
        await setCachedResponse(request, c.res, options);
      } catch (error) {
        // Ignore cache errors in development
        console.warn('Failed to cache response:', error);
      }
    }
    
    // Return the response
    return c.res;
  };
}

/**
 * Memory cache for frequently accessed data (in Worker memory)
 * Note: This is per-worker instance and will be cleared on cold start
 */
class MemoryCache {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key: string, data: any, ttl: number = 300): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const memoryCache = new MemoryCache();

/**
 * KV-based cache for persistent caching across requests
 * Requires KV namespace binding in wrangler.jsonc
 */
export class KVCache {
  constructor(private kv: KVNamespace) {}
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      return value as T | null;
    } catch (error) {
      console.error('KV cache get error:', error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const options = ttl ? { expirationTtl: ttl } : undefined;
      await this.kv.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.error('KV cache set error:', error);
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('KV cache delete error:', error);
    }
  }
  
  async list(prefix?: string): Promise<string[]> {
    try {
      const list = await this.kv.list({ prefix });
      return list.keys.map(k => k.name);
    } catch (error) {
      console.error('KV cache list error:', error);
      return [];
    }
  }
}

/**
 * Cache strategies
 */
export const CacheStrategy = {
  /**
   * Cache-First: Check cache first, then fetch if not found
   */
  CACHE_FIRST: { ttl: 3600 }, // 1 hour
  
  /**
   * Network-First: Try network first, fallback to cache on error
   */
  NETWORK_FIRST: { ttl: 300 }, // 5 minutes
  
  /**
   * Stale-While-Revalidate: Return cached, update in background
   */
  SWR: { ttl: 60, swr: 3600 }, // 1 minute cache, 1 hour stale
  
  /**
   * No Cache: Always fetch fresh data
   */
  NO_CACHE: { ttl: 0 },
  
  /**
   * Static Assets: Long-term caching
   */
  STATIC: { ttl: 86400 }, // 24 hours
  
  /**
   * API Responses: Short-term caching
   */
  API: { ttl: 300 }, // 5 minutes
  
  /**
   * Market Data: Medium-term caching
   */
  MARKET_DATA: { ttl: 1800 }, // 30 minutes
  
  /**
   * User Data: Very short-term caching
   */
  USER_DATA: { ttl: 60 }, // 1 minute
};
