import { Elysia, status } from 'elysia'
import { authService } from './auth.service'
import { loginBodySchema } from './auth.schemas'
import { AppError } from '@/server/app-error.class'
import { issueAuthToken } from '@/lib/auth/auth-token'
import { loginFailureResponseSchema, loginSuccessResponseSchema } from './auth.schemas'
import { getAuthCookieOptions, getClearedAuthCookieOptions } from '@/lib/auth/auth-cookie'
import { ACCOUNT_FROZEN, AUTH_COOKIE, INCORRECT_CREDENTIALS, UNKNOWN_ERR } from '@/constants'

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
      error: ({ error }) => {
        const message = error instanceof Error ? error.message : UNKNOWN_ERR
        if (!(error instanceof AppError)) {
          return status(500, { code: UNKNOWN_ERR, error: UNKNOWN_ERR })
        }
        switch (error.code) {
          case ACCOUNT_FROZEN:
            return status(403, { code: ACCOUNT_FROZEN, error: message })
          case INCORRECT_CREDENTIALS:
            return status(401, { code: INCORRECT_CREDENTIALS, error: message })
          default:
            return status(401, {
              code: INCORRECT_CREDENTIALS,
              error: 'Invalid username or password',
            })
        }
      },
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
