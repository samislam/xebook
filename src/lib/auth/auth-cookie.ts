import ms, { type StringValue } from 'ms'
import type { CookieOptions } from 'elysia'
import { serverEnv } from '@/server/server-env'

export const getAuthMaxAgeSeconds = () => {
  const durationMs = ms(serverEnv.AUTH_TOKEN_EXPIRES_IN as StringValue)
  if (typeof durationMs !== 'number' || durationMs <= 0) {
    throw new Error('Invalid AUTH_TOKEN_EXPIRES_IN value')
  }
  return Math.floor(durationMs / 1000)
}

export const getAuthCookieOptions = (maxAge: number = getAuthMaxAgeSeconds()): CookieOptions => ({
  maxAge,
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
})

export const getClearedAuthCookieOptions = (): CookieOptions => getAuthCookieOptions(0)
