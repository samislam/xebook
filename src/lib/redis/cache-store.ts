import ms from 'ms'
import { withCache } from '@/lib/redis/with-cache'

export const example_cache = withCache({
  cacheTtlMs: ms('30s'),
  cachePrefix: 'example',
  shouldCache: (_result) => true,
  callback: async () => {
    return { name: 'example' }
  },
})
