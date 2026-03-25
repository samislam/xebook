import { z } from 'zod'
import { createDataResponseSchema } from '../../utils/response-schemas'
import { priceCalculatorSchema } from '@/app/[locale]/(routing)/(protected)/price-calculator/price-calculator.schema'

export const scenarioIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const priceCalculatorScenarioValuesSchema = priceCalculatorSchema

export const savePriceCalculatorScenarioBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  values: priceCalculatorScenarioValuesSchema,
})

export const priceCalculatorScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: priceCalculatorScenarioValuesSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const savePriceCalculatorScenarioResponseSchema = createDataResponseSchema(
  priceCalculatorScenarioSchema
)

export const listPriceCalculatorScenariosResponseSchema = createDataResponseSchema(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
  )
)

export const priceCalculatorScenarioResponseSchema = createDataResponseSchema(
  priceCalculatorScenarioSchema
)

export const deletePriceCalculatorScenarioResponseSchema = createDataResponseSchema(
  z.object({
    success: z.literal(true),
    deletedScenarioId: z.string(),
  })
)

export type SavePriceCalculatorScenarioValues = z.infer<
  typeof savePriceCalculatorScenarioBodySchema
>
