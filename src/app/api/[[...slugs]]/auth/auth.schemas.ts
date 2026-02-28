import { t } from 'elysia'

export const loginBodySchema = t.Object({
  password: t.String({ minLength: 1 }),
})

export const loginSuccessResponseSchema = t.Object({
  success: t.Literal(true),
})

export const loginFailureResponseSchema = t.Object({
  error: t.String(),
})
