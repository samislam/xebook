import { Elysia } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { authService } from './auth.service'
import { loginBodySchema } from './auth.schemas'
import { issueAuthToken } from '@/lib/auth/auth-token'
import { resourceErrorClassifier } from '../../utils/resource-error-classifier'
import { loginFailureResponseSchema, loginSuccessResponseSchema } from './auth.schemas'
import { getAuthCookieOptions, getClearedAuthCookieOptions } from '@/lib/auth/auth-cookie'

export const authController = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, cookie }) => {
      const authResult = await authService.validateCredentials(body.username, body.password)
      const token = await issueAuthToken(authResult.id)
      cookie[AUTH_COOKIE].set({
        value: token,
        ...getAuthCookieOptions(),
      })

      return { success: true }
    },
    {
      body: loginBodySchema,
      error: ({ code, error }) =>
        resourceErrorClassifier(code, error, 'Invalid username or password'),
      response: {
        200: loginSuccessResponseSchema,
        401: loginFailureResponseSchema,
        403: loginFailureResponseSchema,
        422: loginFailureResponseSchema,
        500: loginFailureResponseSchema,
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
