import 'server-only'

import { serverEnv } from '@/server/server-env'
import { getRedisClient } from './redis-client'

/**
 * Minimal JSON-based Redis cache helper with graceful fallback.
 *
 * Notes:
 * - Stores values as JSON strings (`JSON.stringify` / `JSON.parse`).
 * - Uses TTL in milliseconds via Redis `PX`.
 * - Returns `null`/no-op when Redis is disabled or unavailable.
 */
export const redisJsonCache = {
  /** Indicates whether Redis caching is configured (`REDIS_URL` is present). */
  get isEnabled() {
    return serverEnv.ENABLE_REDIS_CACHE && Boolean(serverEnv.REDIS_URL)
  },

  /** Gets and deserializes a JSON value by key. Returns `null` on miss/failure. */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const raw = await client.get(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  /** Serializes and stores a JSON value with TTL in milliseconds. */
  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    if (!this.isEnabled) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.set(key, JSON.stringify(value), 'PX', ttlMs)
    } catch {
      // Ignore cache write failures; request flow should still succeed.
    }
  },

  /** Deletes a cached key. */
  async del(key: string): Promise<void> {
    if (!this.isEnabled) return
    const client = getRedisClient()
    if (!client) return

    try {
      await client.del(key)
    } catch {
      // Ignore cache delete failures; request flow should still succeed.
    }
  },
}
