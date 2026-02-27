import { z } from 'zod'
import { createEnv } from '@t3-oss/env-nextjs'

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_TOLGEE_API_KEY: z.string().trim().optional(),
    NEXT_PUBLIC_TOLGEE_API_URL: z.string().url().trim().optional(),
    NEXT_PUBLIC_TOLGEE_PROJECT_ID: z.union([z.number(), z.string()]).optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url(),
    NEXT_PUBLIC_ENVIRONMENT: z
      .enum(['production', 'staging', 'testing', 'localhost'])
      .default('localhost'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_TOLGEE_API_KEY: process.env.NEXT_PUBLIC_TOLGEE_API_KEY,
    NEXT_PUBLIC_TOLGEE_API_URL: process.env.NEXT_PUBLIC_TOLGEE_API_URL,
    NEXT_PUBLIC_TOLGEE_PROJECT_ID: process.env.NEXT_PUBLIC_TOLGEE_PROJECT_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },
})
