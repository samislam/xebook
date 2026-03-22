import { Elysia, status } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { authService } from '../auth/auth.service'

export const AuthMacro = new Elysia({ name: 'protected.macro' }).macro({
  auth: (policy?: AuthPolicy) => ({
    beforeHandle: async ({ cookie }) => {
      if (!policy?.protected) return
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await authService.getAuthenticatedUserFromToken(token)
      if (!user) {
        return status(401, { error: 'Unauthorized' })
      }
    },
  }),
})

type AuthPolicy = { protected?: boolean }
