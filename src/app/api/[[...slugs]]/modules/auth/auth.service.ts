import { verifyAuthToken } from '@/lib/auth/auth-token'
import { AppError } from '../../classes/app-error.class'
import { verifyPasswordHash } from '@/lib/auth/password'
import { prismaClient } from '@/lib/prisma/prisma-client'
import { ACCOUNT_FROZEN, INCORRECT_CREDENTIALS } from '@/constants'

export class AuthService {
  async validateCredentials(username: string, password: string) {
    const user = await prismaClient.user.findUnique({ where: { username } })
    if (!user) throw new AppError(INCORRECT_CREDENTIALS, 'Invalid username or password')
    if (user.isFrozen) throw new AppError(ACCOUNT_FROZEN, 'User is frozen')
    const isValid = await verifyPasswordHash(password, user.passwordHash)
    if (!isValid) throw new AppError(INCORRECT_CREDENTIALS, 'Invalid username or password')
    return user
  }

  async getAuthenticatedUserFromToken(token: string | null | undefined) {
    if (!token) return null

    const payload = await verifyAuthToken(token)
    const userId = typeof payload?.sub === 'string' ? payload.sub : null
    if (!userId) return null

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    })
    if (!user) return null
    if (user.isFrozen) throw new AppError(ACCOUNT_FROZEN, 'User is frozen')
    return user
  }
}

export const authService = new AuthService()
