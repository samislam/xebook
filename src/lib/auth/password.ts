import { promisify } from 'node:util'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

/**
 * Hashes a plain-text password with `scrypt` using a random per-password salt.
 *
 * The persisted format is `salt:derivedKeyHex`.
 *
 * @param password - Plain-text password supplied by the user.
 * @returns Encoded password hash ready to store in the database.
 * @throws {Error} When the password is empty after trimming.
 */
export const hashPassword = async (password: string) => {
  const normalized = password.trim()
  if (!normalized) {
    throw new Error('Password is required')
  }

  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(normalized, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plain-text password against a stored `salt:derivedKeyHex` hash.
 *
 * Uses `timingSafeEqual` after deriving the candidate key to avoid leaking comparison timing.
 *
 * @param password - Plain-text password supplied by the user.
 * @param passwordHash - Stored password hash in `salt:derivedKeyHex` format.
 * @returns `true` when the password matches the stored hash, otherwise `false`.
 */
export const verifyPasswordHash = async (password: string, passwordHash: string) => {
  const [salt, storedHex] = passwordHash.split(':')
  if (!salt || !storedHex) return false

  const derivedKey = (await scrypt(password.trim(), salt, KEY_LENGTH)) as Buffer
  const storedBuffer = Buffer.from(storedHex, 'hex')

  if (storedBuffer.length !== derivedKey.length) return false

  return timingSafeEqual(storedBuffer, derivedKey)
}
