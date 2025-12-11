// lib/rateLimit.ts
import { Redis } from "@upstash/redis"

/**
 * Production-ready rate limiter using Upstash Redis
 * Works with serverless deployments (Vercel, Netlify, etc.)
 */

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
}

/**
 * Check if a reference has exceeded rate limit
 * @param reference - Payment reference to check
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  reference: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const key = `rate_limit:payment:${reference}`
    const now = Date.now()

    // Get current count and TTL
    const [count, ttl] = await Promise.all([
      redis.get<number>(key),
      redis.ttl(key),
    ])

    const currentCount = count || 0
    const resetTime = ttl > 0 ? now + ttl * 1000 : now + config.windowMs

    // If limit exceeded
    if (currentCount >= config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      }
    }

    // Increment counter
    if (currentCount === 0) {
      // First attempt - set with expiry
      await redis.set(key, 1, { px: config.windowMs })
    } else {
      // Subsequent attempt - increment
      await redis.incr(key)
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - currentCount - 1,
      resetTime,
    }
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetTime: Date.now() + config.windowMs,
    }
  }
}

/**
 * Reset rate limit for a specific reference
 * Useful for testing or manual intervention
 */
export async function resetRateLimit(reference: string): Promise<boolean> {
  try {
    const key = `rate_limit:payment:${reference}`
    await redis.del(key)
    return true
  } catch (error) {
    console.error("Failed to reset rate limit:", error)
    return false
  }
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  reference: string
): Promise<{ count: number; resetTime: number | null }> {
  try {
    const key = `rate_limit:payment:${reference}`
    const [count, ttl] = await Promise.all([
      redis.get<number>(key),
      redis.ttl(key),
    ])

    return {
      count: count || 0,
      resetTime: ttl > 0 ? Date.now() + ttl * 1000 : null,
    }
  } catch (error) {
    console.error("Failed to get rate limit status:", error)
    return { count: 0, resetTime: null }
  }
}

/**
 * IP-based rate limiting for additional protection
 * Limits requests per IP address
 */
export async function checkIPRateLimit(
  ipAddress: string,
  config: RateLimitConfig = { maxAttempts: 20, windowMs: 60000 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const key = `rate_limit:ip:${ipAddress}`
    const now = Date.now()

    const [count, ttl] = await Promise.all([
      redis.get<number>(key),
      redis.ttl(key),
    ])

    const currentCount = count || 0
    const resetTime = ttl > 0 ? now + ttl * 1000 : now + config.windowMs

    if (currentCount >= config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      }
    }

    if (currentCount === 0) {
      await redis.set(key, 1, { px: config.windowMs })
    } else {
      await redis.incr(key)
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - currentCount - 1,
      resetTime,
    }
  } catch (error) {
    console.error("IP rate limit check failed:", error)
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetTime: Date.now() + config.windowMs,
    }
  }
}

/**
 * Combined rate limiting - checks both reference and IP
 */
export async function checkCombinedRateLimit(
  reference: string,
  ipAddress: string
): Promise<{
  allowed: boolean
  reason?: string
  remaining: number
  resetTime: number
}> {
  // Check reference rate limit
  const refLimit = await checkRateLimit(reference)
  if (!refLimit.allowed) {
    return {
      allowed: false,
      reason: "Too many verification attempts for this transaction",
      remaining: 0,
      resetTime: refLimit.resetTime,
    }
  }

  // Check IP rate limit
  const ipLimit = await checkIPRateLimit(ipAddress)
  if (!ipLimit.allowed) {
    return {
      allowed: false,
      reason: "Too many requests from your IP address",
      remaining: 0,
      resetTime: ipLimit.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: Math.min(refLimit.remaining, ipLimit.remaining),
    resetTime: Math.max(refLimit.resetTime, ipLimit.resetTime),
  }
}