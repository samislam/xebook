import { z } from 'zod'

export const loginBodySchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(100),
  password: z.string().trim().min(1).max(255),
})
export type LoginValues = z.infer<typeof loginBodySchema>

export const loginSuccessResponseSchema = z.object({
  success: z.literal(true),
})

export const loginFailureResponseSchema = z.object({
  error: z.string(),
})
