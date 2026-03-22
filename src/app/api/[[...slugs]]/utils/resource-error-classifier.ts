import { status } from 'elysia'
import { AppError } from '@/app/api/[[...slugs]]/classes/app-error.class'
import { UNAUTHENTICATED, UNKNOWN_ERR, VALIDATION_ERR } from '@/constants'
import { ACCOUNT_FROZEN, DUPLICATE_ENTRY, INCORRECT_CREDENTIALS, NOT_FOUND } from '@/constants'

export const resourceErrorClassifier = (
  code: string | number,
  error: unknown,
  fallback: string
) => {
  if (code === 'VALIDATION') return status(422, { code, error: fallback })
  const message = error instanceof Error ? error.message : UNKNOWN_ERR
  if (!(error instanceof AppError)) {
    return status(500, { code: UNKNOWN_ERR, error: fallback })
  }

  switch (error.code) {
    case NOT_FOUND:
      return status(404, { code: NOT_FOUND, error: message })
    case DUPLICATE_ENTRY:
      return status(409, { code: DUPLICATE_ENTRY, error: message })
    case ACCOUNT_FROZEN:
      return status(403, { code: ACCOUNT_FROZEN, error: message })
    case UNAUTHENTICATED:
      return status(401, { code: UNAUTHENTICATED, error: message })
    case INCORRECT_CREDENTIALS:
      return status(401, { code: INCORRECT_CREDENTIALS, error: message })
    case VALIDATION_ERR:
      return status(400, { code: VALIDATION_ERR, error: message })
    default:
      return status(500, { code: UNKNOWN_ERR, error: fallback })
  }
}
