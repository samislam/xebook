import { z } from 'zod'
import { createDataResponseSchema } from '../../utils/response-schemas'

export const userParamsSchema = z.object({
  id: z.string().min(1),
})

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  isFrozen: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const userResponseSchema = createDataResponseSchema(userSchema)

export const listUsersResponseSchema = createDataResponseSchema(z.array(userSchema))

export const createUserBodySchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  password: z.string().min(8).max(255),
})

export const updateUserBodySchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(255).optional(),
})

export const changeMyPasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(255),
  newPassword: z.string().min(8).max(255),
})

export const changeUserPasswordBodySchema = z.object({
  newPassword: z.string().min(8).max(255),
})

export const successSchema = z.object({
  success: z.literal(true),
})

export const successResponseSchema = createDataResponseSchema(successSchema)
