import { Redis } from '@upstash/redis'

const hasRedis = process.env.UPSTASH_REDIS_REST_URL &&
                process.env.UPSTASH_REDIS_REST_TOKEN &&
                !process.env.UPSTASH_REDIS_REST_URL.includes('dummy')

export const redis = hasRedis ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  // If Redis is not configured, allow all requests (dev mode)
  if (!redis) {
    console.log(`[Dev Mode] Rate limit bypassed for: ${key}`)
    return true
  }

  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, windowSeconds)
    }
    return count <= limit
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Allow request on Redis error (fail open)
    return true
  }
}
