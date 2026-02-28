import { Elysia } from 'elysia'
import { AuthMacro } from '../macros/auth.macro'
import { transactionController } from './transaction.controller'

export const transactionModule = new Elysia({ name: 'transaction.module' })
  .use(AuthMacro)
  .guard({ auth: { protected: true } }, (app) => app.use(transactionController))
