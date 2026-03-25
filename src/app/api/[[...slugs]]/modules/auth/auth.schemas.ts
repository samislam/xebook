import { z } from 'zod'
import { createDataResponseSchema, errorResponseSchema } from '../../utils/response-schemas'

export const loginBodySchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(100),
  password: z.string().trim().min(1).max(255),
})
export type LoginValues = z.infer<typeof loginBodySchema>

export const loginSuccessSchema = z.object({
  success: z.literal(true),
})

export const loginSuccessResponseSchema = createDataResponseSchema(loginSuccessSchema)

export { errorResponseSchema as loginFailureResponseSchema }
