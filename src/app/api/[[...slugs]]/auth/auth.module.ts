import { Elysia } from 'elysia'
import { authController } from './auth.controller'

export const authModule = new Elysia({ name: 'auth.module' }).use(authController)
