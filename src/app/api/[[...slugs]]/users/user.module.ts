import { Elysia } from 'elysia'
import { meController } from './me.controller'
import { userController } from './user.controller'

export const userModule = new Elysia({ name: 'user.module' }).use(userController).use(meController)
