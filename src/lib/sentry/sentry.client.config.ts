import * as Sentry from '@sentry/nextjs'
import { clientEnv } from '@/server/client-env'

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 1,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
  environment: clientEnv.NEXT_PUBLIC_ENVIRONMENT,
})
