import { Elysia, status } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { authService } from './auth.service'
import { loginBodySchema } from './auth.schemas'
import { issueAuthToken } from '@/lib/auth/auth-token'
import { loginFailureResponseSchema, loginSuccessResponseSchema } from './auth.schemas'
import { getAuthCookieOptions, getClearedAuthCookieOptions } from '@/lib/auth/auth-cookie'

export const authController = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, cookie }) => {
      const authResult = await authService.validateCredentials(body.username, body.password)
      if (authResult === 'frozen') {
        return status(403, { error: 'User is frozen' })
      }
      if (!authResult) {
        return status(401, { error: 'Invalid username or password' })
      }

      const token = await issueAuthToken(authResult.id)
      cookie[AUTH_COOKIE].set({
        value: token,
        ...getAuthCookieOptions(),
      })

      return { success: true }
    },
    {
      body: loginBodySchema,
      response: {
        200: loginSuccessResponseSchema,
        401: loginFailureResponseSchema,
        403: loginFailureResponseSchema,
      },
    }
  )
  .post(
    '/logout',
    ({ cookie }) => {
      cookie[AUTH_COOKIE].set({
        value: '',
        ...getClearedAuthCookieOptions(),
      })

      return { success: true as const }
    },
    {
      response: {
        200: loginSuccessResponseSchema,
      },
    }
  )
