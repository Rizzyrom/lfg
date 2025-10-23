/**
 * High-performance caching layer with Redis/Upstash and in-memory fallback
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client (only if credentials available)
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (error) {
  console.warn('Redis initialization failed, using in-memory cache:', error)
}

// In-memory cache fallback (with LRU eviction)
interface CacheEntry {
  value: any
  expiresAt: number
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 1000 // Limit to 1000 entries

  set(key: string, value: any, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const memoryCache = new InMemoryCache()

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (redis) {
      const value = await redis.get(key)
      if (value !== null) {
        return value as T
      }
    }

    // Fallback to in-memory cache
    return memoryCache.get(key)
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set cached value with TTL
 */
export async function setCached(
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    // Set in Redis
    if (redis) {
      await redis.setex(key, ttlSeconds, value)
    }

    // Always set in memory cache as backup
    memoryCache.set(key, value, ttlSeconds)
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key)
    }
    memoryCache.delete(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Clear all cached values (use with caution)
 */
export async function clearCache(): Promise<void> {
  try {
    if (redis) {
      await redis.flushdb()
    }
    memoryCache.clear()
  } catch (error) {
    console.error('Cache clear error:', error)
  }
}

/**
 * Wrapper for caching function results
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function and cache result
  const result = await fn()
  await setCached(key, result, ttlSeconds)
  return result
}

/**
 * Request deduplication for parallel requests
 */
const pendingRequests = new Map<string, Promise<any>>()

export async function dedupRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>
  }

  // Execute and cache the promise
  const promise = fn().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

/**
 * Combined caching + deduplication
 */
export async function cachedRequest<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  return dedupRequest(key, () => withCache(key, ttlSeconds, fn))
}
