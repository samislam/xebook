import { jwtVerify, SignJWT } from 'jose'
import { serverEnv } from '@/server/server-env'

const AUTH_ISSUER = 'xebook'
const AUTH_AUDIENCE = 'xebook-app'

const toSecret = (secret: string) => new TextEncoder().encode(secret)

/**
 * Issues an authentication JWT for a specific user.
 *
 * The token uses the configured application issuer/audience and expires according to
 * `AUTH_TOKEN_EXPIRES_IN`. The JWT expiry is intentionally aligned with the auth cookie max-age.
 *
 * @param userId - The authenticated user's unique identifier. Stored in the JWT `sub` claim.
 * @returns A signed JWT string.
 */
export const issueAuthToken = async (userId: string) => {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(serverEnv.AUTH_TOKEN_EXPIRES_IN)
    .sign(toSecret(serverEnv.AUTH_JWT_SECRET))
}

/**
 * Verifies an authentication JWT and returns its payload when valid.
 *
 * Validation checks the JWT signature, issuer, audience, and expiration time. Invalid or expired
 * tokens return `null` instead of throwing.
 *
 * @param token - Raw JWT string from the auth cookie.
 * @param secret - Optional signing secret override. Defaults to `AUTH_JWT_SECRET`.
 * @returns The verified JWT payload, or `null` when verification fails.
 */
export const verifyAuthToken = async (
  token: string,
  secret: string = serverEnv.AUTH_JWT_SECRET
) => {
  try {
    const { payload } = await jwtVerify(token, toSecret(secret), {
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
    })
    return payload
  } catch {
    return null
  }
}
