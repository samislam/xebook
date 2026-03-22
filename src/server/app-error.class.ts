import type { AppErrorCodes } from '@/constants'

export class AppError extends Error {
  code: AppErrorCodes

  constructor(code: AppErrorCodes, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}
