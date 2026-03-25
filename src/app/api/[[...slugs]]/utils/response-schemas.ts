import { z } from 'zod'

export const errorResponseSchema = z.object({
  code: z.string(),
  error: z.string(),
})

export const createDataResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema,
  })

export const authErrorResponses = {
  401: errorResponseSchema,
  403: errorResponseSchema,
  422: errorResponseSchema,
  500: errorResponseSchema,
} as const

export const resourceErrorResponses = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  409: errorResponseSchema,
  422: errorResponseSchema,
  500: errorResponseSchema,
} as const
