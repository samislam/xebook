import { Elysia, status } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { authService } from './auth.service'
import { serverEnv } from '@/server/server-env'
import { loginBodySchema } from './auth.schemas'
import { issueAuthToken } from '@/lib/auth/auth-token'
import { loginFailureResponseSchema } from './auth.schemas'
import { loginSuccessResponseSchema } from './auth.schemas'

export const authController = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, set }) => {
      const isValid = authService.verifyPassword(body.password)
      if (!isValid) return status(401, { error: 'Invalid password' })

      const token = await issueAuthToken(serverEnv.AUTH_JWT_SECRET)
      const isProduction = process.env.NODE_ENV === 'production'
      set.headers['set-cookie'] =
        `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` +
        (isProduction ? '; Secure' : '')

      return { success: true as const }
    },
    {
      body: loginBodySchema,
      response: {
        200: loginSuccessResponseSchema,
        401: loginFailureResponseSchema,
      },
    }
  )
  .post(
    '/logout',
    ({ set }) => {
      const isProduction = process.env.NODE_ENV === 'production'
      set.headers['set-cookie'] =
        `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` +
        (isProduction ? '; Secure' : '')

      return { success: true as const }
    },
    {
      response: {
        200: loginSuccessResponseSchema,
      },
    }
  )
