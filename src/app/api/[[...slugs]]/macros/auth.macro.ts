import { Elysia, status } from 'elysia'
import { authService } from '../auth/auth.service'
import { AppError } from '@/server/app-error.class'
import { ACCOUNT_FROZEN, AUTH_COOKIE, UNAUTHENTICATED } from '@/constants'

export const AuthMacro = new Elysia({ name: 'protected.macro' }).macro({
  auth: (policy?: AuthPolicy) => ({
    beforeHandle: async ({ cookie }) => {
      if (!policy?.protected) return
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      let user = null
      try {
        user = await authService.getAuthenticatedUserFromToken(token)
      } catch (error) {
        if (error instanceof AppError && error.code === ACCOUNT_FROZEN) {
          return status(403, { code: ACCOUNT_FROZEN, error: error.message })
        }
        return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })
      }

      if (!user) {
        return status(401, { code: UNAUTHENTICATED, error: 'Unauthorized' })
      }
    },
  }),
})

type AuthPolicy = { protected?: boolean }
