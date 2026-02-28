import { jwtVerify, SignJWT } from 'jose'

const AUTH_ISSUER = 'exchange-profitbook'
const AUTH_AUDIENCE = 'exchange-profitbook-app'

const toSecret = (secret: string) => new TextEncoder().encode(secret)

export const issueAuthToken = async (secret: string) => {
  return new SignJWT({ sub: 'tradebook-user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(toSecret(secret))
}

export const verifyAuthToken = async (token: string, secret: string) => {
  try {
    await jwtVerify(token, toSecret(secret), {
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
    })
    return true
  } catch {
    return false
  }
}
