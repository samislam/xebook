import { timingSafeEqual } from 'node:crypto'
import { serverEnv } from '@/server/server-env'

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

export class AuthService {
  verifyPassword(password: string) {
    return safeEqual(password, serverEnv.LOGIN_PASSWORD)
  }
}

export const authService = new AuthService()
