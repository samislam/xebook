import { z } from 'zod'

export const createCycleSchema = z.object({
  name: z.string().trim().min(1, 'Cycle name is required').max(100, 'Cycle name is too long'),
})

export type CreateCycleFormValues = z.infer<typeof createCycleSchema>
