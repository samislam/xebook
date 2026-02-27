import { Elysia } from 'elysia'
import { AuthMacro } from '../macros/auth.macro'
import { exampleController } from './example.controller'

export const exampleModule = new Elysia({ name: 'example.module' })
  .use(AuthMacro)
  .guard({ auth: { protected: true } }, (app) => app.use(exampleController))
