import { Elysia } from 'elysia'
import { authModule } from './modules/auth/auth.module'
import { userModule } from './modules/users/user.module'
import { transactionModule } from './modules/transactions/transaction.module'

export const app = new Elysia({ prefix: '/api' }) //
  .use(authModule)
  .use(userModule)
  .use(transactionModule)

export const GET = app.fetch
export const POST = app.fetch
export const PUT = app.fetch
export const PATCH = app.fetch
export const DELETE = app.fetch
