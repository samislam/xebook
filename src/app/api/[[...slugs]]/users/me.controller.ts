import { Elysia, status } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { userService } from './user.service'
import { AuthMacro } from '../macros/auth.macro'
import { authService } from '../auth/auth.service'
import { successResponseSchema, changeMyPasswordBodySchema } from './user.schemas'
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
      if (!user) {
        return status(401, { error: 'Unauthorized' })
      }
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
      },
    }
  )
  .patch(
    '/me',
    async ({ body, cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      if (!user) {
        return status(401, { error: 'Unauthorized' })
      }

      try {
        return await userService.updateUser(user.id, body)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update profile'
        return status(400, { error: message })
      }
    },
    {
      auth: { protected: true },
      body: updateUserBodySchema,
      response: {
        200: userResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    }
  )
  .post(
    '/me/change-password',
    async ({ body, cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      if (!user) {
        return status(401, { error: 'Unauthorized' })
      }

      try {
        return await userService.changeMyPassword(user.id, body.currentPassword, body.newPassword)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to change password'
        return status(400, { error: message })
      }
    },
    {
      auth: { protected: true },
      body: changeMyPasswordBodySchema,
      response: {
        200: successResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    }
  )
