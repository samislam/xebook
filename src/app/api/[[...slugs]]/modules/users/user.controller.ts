import { Elysia, status } from 'elysia'
import { userService } from './user.service'
import { UNAUTHENTICATED } from '@/constants'
import { AuthMacro } from '../macros/auth.macro'
import { authService } from '../auth/auth.service'
import { AUTH_COOKIE, NOT_FOUND } from '@/constants'
import { userParamsSchema, userResponseSchema } from './user.schemas'
import { createUserBodySchema, updateUserBodySchema } from './user.schemas'
import { errorResponseSchema, successResponseSchema } from './user.schemas'
import { resourceErrorClassifier } from '../../utils/resource-error-classifier'
import { listUsersResponseSchema, changeUserPasswordBodySchema } from './user.schemas'

const requireAuthUser = async (token: string | null | undefined) => {
  return authService.getAuthenticatedUserFromToken(token)
}

export const userController = new Elysia({ prefix: '/users' })
  .use(AuthMacro)
  .get('/', async () => userService.listUsers(), {
    auth: { protected: true },
    response: {
      200: listUsersResponseSchema,
      401: errorResponseSchema,
    },
  })
  .get(
    '/:id',
    async ({ params }) => {
      const user = await userService.getUserById(params.id)
      if (!user) {
        return status(404, { code: NOT_FOUND, error: 'User not found' })
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
        409: errorResponseSchema,
      },
    }
  )
  .post(
    '/',
    async ({ body, cookie }) => {
      const userCount = await userService.countUsers()
      if (userCount > 0) {
        const token =
          typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
        const authUser = await requireAuthUser(token)
        if (!authUser) {
          return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })
        }
      }

      return userService.createUser(body)
    },
    {
      body: createUserBodySchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to create user'),
      response: {
        200: userResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
        422: errorResponseSchema,
        500: errorResponseSchema,
      },
    }
  )
  .patch('/:id', async ({ body, params }) => userService.updateUser(params.id, body), {
    auth: { protected: true },
    body: updateUserBodySchema,
    params: userParamsSchema,
    error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to update user'),
    response: {
      200: userResponseSchema,
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  })
  .delete('/:id', async ({ params }) => userService.deleteUser(params.id), {
    auth: { protected: true },
    params: userParamsSchema,
    error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to delete user'),
    response: {
      200: successResponseSchema,
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  })
  .post(
    '/:id/change-password',
    async ({ body, params }) => userService.changeUserPassword(params.id, body.newPassword),
    {
      auth: { protected: true },
      body: changeUserPasswordBodySchema,
      params: userParamsSchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to change password'),
      response: {
        200: successResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
        422: errorResponseSchema,
        500: errorResponseSchema,
      },
    }
  )
  .post('/:id/freeze', async ({ params }) => userService.freezeUser(params.id), {
    auth: { protected: true },
    params: userParamsSchema,
    error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to freeze user'),
    response: {
      200: userResponseSchema,
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  })
  .post('/:id/unfreeze', async ({ params }) => userService.unfreezeUser(params.id), {
    auth: { protected: true },
    params: userParamsSchema,
    error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to unfreeze user'),
    response: {
      200: userResponseSchema,
      400: errorResponseSchema,
      401: errorResponseSchema,
      403: errorResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
      422: errorResponseSchema,
      500: errorResponseSchema,
    },
  })
