import { z } from 'zod'
import { createEnv } from '@t3-oss/env-nextjs'

export const serverEnv = createEnv({
  server: {
    PORT: z.number().default(3000),
    SENTRY_ORG: z.string(),
    SENTRY_PROJECT: z.string(),
    IMAGE_OPTIMIZATION: z.enum(['yes', 'no']).default('yes'),
  },
  experimental__runtimeEnv: {
    PORT: process.env.PORT ? +process.env.PORT : undefined,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    IMAGE_OPTIMIZATION: process.env.IMAGE_OPTIMIZATION,
  },
})
