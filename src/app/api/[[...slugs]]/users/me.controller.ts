import { Elysia, status } from 'elysia'
import { userService } from './user.service'
import { AuthMacro } from '../macros/auth.macro'
import { authService } from '../auth/auth.service'
import { AppError } from '@/server/app-error.class'
import { NOT_FOUND, AUTH_COOKIE, ACCOUNT_FROZEN, UNKNOWN_ERR } from '@/constants'
import { successResponseSchema, changeMyPasswordBodySchema } from './user.schemas'
import { VALIDATION_ERR, UNAUTHENTICATED, INCORRECT_CREDENTIALS } from '@/constants'
import { userResponseSchema, updateUserBodySchema, errorResponseSchema } from './user.schemas'

const requireAuthUser = async (token: string | null | undefined) => {
  return authService.getAuthenticatedUserFromToken(token)
}

export const meController = new Elysia()
  .use(AuthMacro)
  .get(
    '/me',
    async ({ cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      if (!user) return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        isFrozen: user.isFrozen,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    },
    {
      auth: { protected: true },
      response: {
        200: userResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
      },
    }
  )
  .patch(
    '/me',
    async ({ body, cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      if (!user) return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })

      return userService.updateUser(user.id, body)
    },
    {
      auth: { protected: true },
      body: updateUserBodySchema,
      error: ({ error }) => {
        const message = error instanceof Error ? error.message : UNKNOWN_ERR
        if (!(error instanceof AppError)) {
          return status(500, { code: UNKNOWN_ERR, error: UNKNOWN_ERR })
        }

        switch (error.code) {
          case INCORRECT_CREDENTIALS:
            return status(401, { code: INCORRECT_CREDENTIALS, error: message })
          case ACCOUNT_FROZEN:
            return status(403, { code: ACCOUNT_FROZEN, error: message })
          case NOT_FOUND:
            return status(404, { code: NOT_FOUND, error: message })
          case VALIDATION_ERR:
            return status(400, { code: VALIDATION_ERR, error: message })
          default:
            return status(400, { code: VALIDATION_ERR, error: 'Failed to update profile' })
        }
      },
      response: {
        200: userResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
  .post(
    '/me/change-password',
    async ({ body, cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      if (!user) return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })

      return userService.changeMyPassword(user.id, body.currentPassword, body.newPassword)
    },
    {
      auth: { protected: true },
      body: changeMyPasswordBodySchema,
      error: ({ error }) => {
        const message = error instanceof Error ? error.message : UNKNOWN_ERR
        if (!(error instanceof AppError)) {
          return status(500, { code: UNKNOWN_ERR, error: UNKNOWN_ERR })
        }

        switch (error.code) {
          case INCORRECT_CREDENTIALS:
            return status(401, { code: INCORRECT_CREDENTIALS, error: message })
          case ACCOUNT_FROZEN:
            return status(403, { code: ACCOUNT_FROZEN, error: message })
          case NOT_FOUND:
            return status(404, { code: NOT_FOUND, error: message })
          case VALIDATION_ERR:
            return status(400, { code: VALIDATION_ERR, error: message })
          default:
            return status(400, { code: VALIDATION_ERR, error: 'Failed to change password' })
        }
      },
      response: {
        200: successResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
