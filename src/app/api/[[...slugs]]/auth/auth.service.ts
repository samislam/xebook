import { prismaClient } from '@/lib/prisma/prisma-client'
import { verifyAuthToken } from '@/lib/auth/auth-token'
import { verifyPasswordHash } from '@/lib/auth/password'

export class AuthService {
  async validateCredentials(username: string, password: string) {
    const user = await prismaClient.user.findUnique({
      where: { username },
    })

    if (!user) return null
    if (user.isFrozen) return 'frozen' as const

    const isValid = await verifyPasswordHash(password, user.passwordHash)
    if (!isValid) return null

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

    if (!user || user.isFrozen) return null

    return user
  }
}

export const authService = new AuthService()
