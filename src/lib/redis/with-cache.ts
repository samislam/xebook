import 'server-only'

import { serverEnv } from '@/server/server-env'
import { redisJsonCache } from '@/lib/redis/redis-json-cache'

type LocalCacheEntry<T> = {
  expiresAt: number
  value: T
}

type CacheStore<T> = {
  get: () => Promise<T>
  set: (value: T) => Promise<void>
  drop: () => Promise<void>
  refresh: () => Promise<T>
}

/**
 * Configuration for creating a cached async function via `withCache`.
 *
 * @template T Value type returned by the callback and stored in cache.
 */
type WithCacheOptions<T> = {
  /** Cache TTL in milliseconds (applies to Redis and local fallback). */
  cacheTtlMs: number
  /** Redis key namespace prefix. Final key becomes `<cachePrefix>:<cacheKey>`. */
  cachePrefix: string
  /** Async source-of-truth fetcher called on cache miss. */
  callback: (cacheKey: string) => Promise<T>
  /** Optional predicate to decide whether fetched values are cacheable. */
  shouldCache?: (value: T) => boolean
  /** Maximum number of local fallback entries (default: `1000`). */
  localCacheMaxSize?: number
  /** Enables in-memory fallback cache (default: `true`). */
  enableLocalCacheFallback?: boolean
}

const DEFAULT_LOCAL_CACHE_MAX_SIZE = 1000

const compactLocalCache = <T>(
  localCache: Map<string, LocalCacheEntry<T>>,
  maxSize: number,
  now: number
) => {
  if (localCache.size <= maxSize) return

  for (const [key, entry] of localCache) {
    if (entry.expiresAt <= now) localCache.delete(key)
  }

  while (localCache.size > maxSize) {
    const oldestKey = localCache.keys().next().value as string | undefined
    if (!oldestKey) break
    localCache.delete(oldestKey)
  }
}

/**
 * Wraps an async callback with Redis cache + optional in-memory fallback.
 *
 * Returned factory accepts one cache key segment and returns store methods:
 * `get`, `set`, `drop`, and `refresh`.
 */
export const withCache = <T>(options: WithCacheOptions<T>) => {
  const {
    callback,
    cacheTtlMs,
    cachePrefix,
    shouldCache = () => true,
    enableLocalCacheFallback = true,
    localCacheMaxSize = DEFAULT_LOCAL_CACHE_MAX_SIZE,
  } = options

  const isLocalFallbackEnabled = serverEnv.ENABLE_FALLBACK_CACHE && enableLocalCacheFallback

  const localCache = new Map<string, LocalCacheEntry<T>>()

  const read = async (redisKey: string): Promise<T | null> => {
    const now = Date.now()

    if (isLocalFallbackEnabled) {
      const localCached = localCache.get(redisKey)
      if (localCached && localCached.expiresAt <= now) {
        localCache.delete(redisKey)
      } else if (localCached) {
        return localCached.value
      }
    }

    const redisCached = await redisJsonCache.get<T>(redisKey)
    if (redisCached) {
      if (isLocalFallbackEnabled) {
        localCache.set(redisKey, { value: redisCached, expiresAt: now + cacheTtlMs })
        compactLocalCache(localCache, localCacheMaxSize, now)
      }
      return redisCached
    }

    return null
  }

  const write = async (redisKey: string, value: T) => {
    const now = Date.now()
    if (isLocalFallbackEnabled) {
      localCache.set(redisKey, { value, expiresAt: now + cacheTtlMs })
      compactLocalCache(localCache, localCacheMaxSize, now)
    }
    await redisJsonCache.set(redisKey, value, cacheTtlMs)
  }

  return (cacheKey: string): CacheStore<T> => {
    const redisKey = `${cachePrefix}:${cacheKey}`

    return {
      get: async () => {
        const cached = await read(redisKey)
        if (cached !== null) return cached

        const result = await callback(cacheKey)
        if (shouldCache(result)) await write(redisKey, result)
        return result
      },

      set: async (value) => {
        await write(redisKey, value)
      },

      drop: async () => {
        if (isLocalFallbackEnabled) localCache.delete(redisKey)
        await redisJsonCache.del(redisKey)
      },

      refresh: async () => {
        const result = await callback(cacheKey)
        if (shouldCache(result)) await write(redisKey, result)
        else if (isLocalFallbackEnabled) localCache.delete(redisKey)
        return result
      },
    }
  }
}
