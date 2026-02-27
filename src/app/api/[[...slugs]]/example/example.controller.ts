import { Elysia } from 'elysia'
import { exampleService } from './example.service'
import { AuthMacro } from '../macros/auth.macro'

export const exampleController = new Elysia({ prefix: '/examples' })
  .use(AuthMacro) //
  .guard(
    { auth: { protected: true } }, //
    (app) => app.get('/', () => exampleService.getExamples())
  )
