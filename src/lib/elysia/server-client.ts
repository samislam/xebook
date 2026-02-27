import 'server-only'

import { treaty } from '@elysiajs/eden'
import { headers, cookies } from 'next/headers'
import { serverEnv } from '@/server/server-env'
import type { app as App } from '@/app/api/[[...slugs]]/route'

export async function getAppApiClient_server() {
  let userAgent: string | undefined
  let cookieHeader: string | undefined

  try {
    const requestHeaders = await headers()
    const cookieStore = await cookies()
    userAgent = requestHeaders.get('user-agent') ?? undefined
    cookieHeader = cookieStore.toString()
  } catch {
    // Build-time or out-of-request contexts may not expose request headers/cookies.
  }

  // `.api` enters the `/api` prefix from Elysia route config.
  const appApi = treaty<typeof App>(serverEnv.APP_ORIGIN, {
    fetch: {
      credentials: 'include',
    },
    headers: {
      ...(userAgent && { 'x-client-user-agent': userAgent }),
      ...(cookieHeader && { cookie: cookieHeader }),
    },
  }).api

  // Wrap in a plain object so async return doesn't try to assimilate a thenable-like proxy.
  return { appApi }
}
