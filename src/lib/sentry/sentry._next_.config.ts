// Note: this file run by the next.config.ts file.

import { SentryBuildOptions } from '@sentry/nextjs'

const SENTRY_ORG = process.env.SENTRY_ORG
const SENTRY_PROJECT = process.env.SENTRY_PROJECT

export const sentryConfig: SentryBuildOptions = {
  org: SENTRY_ORG,
  project: SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
}
