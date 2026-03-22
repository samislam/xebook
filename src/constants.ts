// # App error codes
export const REF_ERR = 'REF_ERR'
export const NOT_FOUND = 'NOT_FOUND'
export const UNKNOWN_ERR = 'UNKNOWN_ERR'
export const DUPLICATE_ERR = 'DUPLICATE_ERR'
export const VALIDATION_ERR = 'VALIDATION_ERR'
export const ACCOUNT_FROZEN = 'ACCOUNT_FROZEN'
export const DUPLICATE_ENTRY = 'DUPLICATE_ENTRY'
export const UNAUTHENTICATED = 'UNAUTHENTICATED'
export const INCORRECT_CREDENTIALS = 'INCORRECT_CREDENTIALS'
// ... add more

// # Prisma Error codes
export const PRISMA_DUPLICATE_ERR = 'P2002'
export const PRISMA_NOT_FOUND_ERR = 'P2025'
export const PRISMA_REF_ERR = 'P2003'

export const errorCodes = [
  REF_ERR,
  NOT_FOUND,
  UNKNOWN_ERR,
  DUPLICATE_ERR,
  VALIDATION_ERR,
  ACCOUNT_FROZEN,
  DUPLICATE_ENTRY,
  UNAUTHENTICATED,
  INCORRECT_CREDENTIALS,
] as const

export type AppErrorCodes = (typeof errorCodes)[number]

export const LOCALE_COOKIE = 'NEXT_LOCALE'
export const AUTH_COOKIE = 'AUTH_TOKEN'

export const CURRENCY_SYMBOLS = {
  USD: '$',
  TRY: '₺',
  USDT: 'USDT',
} as const
