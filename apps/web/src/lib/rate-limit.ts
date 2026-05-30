/**
 * Simple in-memory sliding window rate limiter.
 * Works per Vercel serverless function instance — good enough to stop
 * accidental hammering and basic abuse. For production at scale, swap
 * the store for Upstash Redis using the same interface.
 */

interface Window {
  count:     number
  resetAt:   number
}

const store = new Map<string, Window>()

// Clean up expired entries every 5 minutes to avoid memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, w] of store.entries()) {
      if (w.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success:   boolean
  remaining: number
  resetAt:   number   // ms epoch
}

/**
 * @param key      Unique string per resource (e.g. `forgot-pw:user@example.com`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // Start a fresh window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  existing.count++
  store.set(key, existing)

  if (existing.count > limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/** Helper — returns a NextResponse 429 payload string */
export function rateLimitExceededResponse(resetAt: number) {
  const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000)
  return {
    error: `Too many requests. Please try again in ${retryAfterSec} seconds.`,
    retryAfter: retryAfterSec,
  }
}
