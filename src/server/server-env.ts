import { z } from 'zod'
import { createEnv } from '@t3-oss/env-nextjs'

export const serverEnv = createEnv({
  server: {
    PORT: z.number().default(3000),
    APP_ORIGIN: z
      .string()
      .trim()
      .url()
      .transform((value) => value.replace(/\/+$/, '')),
    ENABLE_FALLBACK_CACHE: z.boolean().default(true),
    ENABLE_REDIS_CACHE: z.boolean().default(true),
    REDIS_URL: z.string().trim().url().optional(),
    REQUIRE_HTTPS: z.boolean().default(true),
    SENTRY_ORG: z.string(),
    SENTRY_PROJECT: z.string(),
    IMAGE_OPTIMIZATION: z.enum(['yes', 'no']).default('yes'),
  },
  experimental__runtimeEnv: {
    PORT: process.env.PORT ? +process.env.PORT : undefined,
    APP_ORIGIN: process.env.APP_ORIGIN,
    ENABLE_FALLBACK_CACHE: process.env.ENABLE_FALLBACK_CACHE === 'true',
    ENABLE_REDIS_CACHE: process.env.ENABLE_REDIS_CACHE === 'true',
    REDIS_URL: process.env.REDIS_URL,
    REQUIRE_HTTPS: process.env.REQUIRE_HTTPS === 'true' ? true : false,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    IMAGE_OPTIMIZATION: process.env.IMAGE_OPTIMIZATION,
  },
})
