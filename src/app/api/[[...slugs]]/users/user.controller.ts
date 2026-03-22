import { Elysia, status } from 'elysia'
import { Prisma } from '@/generated/prisma'
import { AUTH_COOKIE } from '@/constants'
import { AuthMacro } from '../macros/auth.macro'
import { authService } from '../auth/auth.service'
import { userService } from './user.service'
import {
  userParamsSchema,
  userResponseSchema,
  createUserBodySchema,
  updateUserBodySchema,
  errorResponseSchema,
  successResponseSchema,
  listUsersResponseSchema,
  changeUserPasswordBodySchema,
} from './user.schemas'

const toErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'Username already exists'
    if (error.code === 'P2025') return 'User not found'
  }

  if (error instanceof Error) return error.message
  return fallback
}

const requireAuthUser = async (token: string | null | undefined) => {
  return authService.getAuthenticatedUserFromToken(token)
}

export const userController = new Elysia({ prefix: '/users' })
  .use(AuthMacro)
  .get(
    '/',
    async () => userService.listUsers(),
    {
      auth: { protected: true },
      response: {
        200: listUsersResponseSchema,
        401: errorResponseSchema,
      },
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      const user = await userService.getUserById(params.id)
      if (!user) {
        return status(404, { error: 'User not found' })
      }
      return user
    },
    {
      auth: { protected: true },
      params: userParamsSchema,
      response: {
        200: userResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
  .post(
    '/',
    async ({ body, cookie }) => {
      const userCount = await userService.countUsers()
      if (userCount > 0) {
        const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
        const authUser = await requireAuthUser(token)
        if (!authUser) {
          return status(401, { error: 'Unauthorized' })
        }
      }

      try {
        return await userService.createUser(body)
      } catch (error) {
        return status(400, { error: toErrorMessage(error, 'Failed to create user') })
      }
    },
    {
      body: createUserBodySchema,
      response: {
        200: userResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    }
  )
  .patch(
    '/:id',
    async ({ body, params }) => {
      try {
        return await userService.updateUser(params.id, body)
      } catch (error) {
        const message = toErrorMessage(error, 'Failed to update user')
        const code = message === 'User not found' ? 404 : 400
        return status(code, { error: message })
      }
    },
    {
      auth: { protected: true },
      body: updateUserBodySchema,
      params: userParamsSchema,
      response: {
        200: userResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
  .delete(
    '/:id',
    async ({ params }) => {
      try {
        return await userService.deleteUser(params.id)
      } catch (error) {
        const message = toErrorMessage(error, 'Failed to delete user')
        const code = message === 'User not found' ? 404 : 400
        return status(code, { error: message })
      }
    },
    {
      auth: { protected: true },
      params: userParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
  .post(
    '/:id/change-password',
    async ({ body, params }) => {
      try {
        return await userService.changeUserPassword(params.id, body.newPassword)
      } catch (error) {
        const message = toErrorMessage(error, 'Failed to change password')
        const code = message === 'User not found' ? 404 : 400
        return status(code, { error: message })
      }
    },
    {
      auth: { protected: true },
      body: changeUserPasswordBodySchema,
      params: userParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
  .post(
    '/:id/freeze',
    async ({ params }) => {
      try {
        return await userService.freezeUser(params.id)
      } catch (error) {
        return status(404, { error: toErrorMessage(error, 'User not found') })
      }
    },
    {
      auth: { protected: true },
      params: userParamsSchema,
      response: {
        200: userResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
  .post(
    '/:id/unfreeze',
    async ({ params }) => {
      try {
        return await userService.unfreezeUser(params.id)
      } catch (error) {
        return status(404, { error: toErrorMessage(error, 'User not found') })
      }
    },
    {
      auth: { protected: true },
      params: userParamsSchema,
      response: {
        200: userResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    }
  )
