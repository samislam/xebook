import { z } from 'zod'

export const userParamsSchema = z.object({
  id: z.string().min(1),
})

export const userResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().nullable(),
  isFrozen: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const listUsersResponseSchema = z.array(userResponseSchema)

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

export const successResponseSchema = z.object({
  success: z.literal(true),
})

export const errorResponseSchema = z.object({
  error: z.string(),
})
