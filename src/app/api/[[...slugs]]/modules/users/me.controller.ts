import { Elysia, status } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { userService } from './user.service'
import { UNAUTHENTICATED } from '@/constants'
import { AuthMacro } from '../macros/auth.macro'
import { authService } from '../auth/auth.service'
import { resourceErrorClassifier } from '../../utils/resource-error-classifier'
import { successResponseSchema, changeMyPasswordBodySchema } from './user.schemas'
import { userResponseSchema, updateUserBodySchema } from './user.schemas'
import { errorResponseSchema, resourceErrorResponses } from '../../utils/response-schemas'

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
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          isFrozen: user.isFrozen,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
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

      return { data: await userService.updateUser(user.id, body) }
    },
    {
      auth: { protected: true },
      body: updateUserBodySchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to update profile'),
      response: {
        200: userResponseSchema,
        ...resourceErrorResponses,
      } as const,
    }
  )
  .post(
    '/me/change-password',
    async ({ body, cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      if (!user) return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })

      return {
        data: await userService.changeMyPassword(user.id, body.currentPassword, body.newPassword),
      }
    },
    {
      auth: { protected: true },
      body: changeMyPasswordBodySchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to change password'),
      response: {
        200: successResponseSchema,
        ...resourceErrorResponses,
      } as const,
    }
  )
