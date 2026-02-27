import Redis from 'ioredis'
import { serverEnv } from '@/server/server-env'

let redisClient: Redis | null | undefined
let hasLoggedRedisError = false

/**
 * Returns a singleton Redis client instance.
 *
 * Behavior:
 * - Returns `null` when `REDIS_URL` is not configured.
 * - Lazily creates and memoizes one ioredis client per process.
 * - Logs the first Redis connection/runtime error once and keeps callers safe.
 */
export const getRedisClient = () => {
  if (redisClient !== undefined) return redisClient
  if (!serverEnv.REDIS_URL) {
    redisClient = null
    return redisClient
  }

  redisClient = new Redis(serverEnv.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  })

  redisClient.on('error', (err) => {
    if (hasLoggedRedisError) return
    hasLoggedRedisError = true
    console.error('[redis-cache] Redis error; using in-memory fallback.', err.message)
  })

  return redisClient
}
