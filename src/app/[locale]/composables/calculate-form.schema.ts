import { z } from 'zod'

const isPositiveNumber = (value: string) =>
  Number.isFinite(Number.parseFloat(value)) && Number.parseFloat(value) > 0
const isValidCommission = (value: string) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed < 100
}
const isPositiveInteger = (value: string) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)
}

export const calculateFormSchema = z
  .object({
    localCurrency: z.union([z.literal('TRY'), z.literal('SYP')]),
    exchangeRate: z.string(),
    exchangeTaxPercent: z.string(),
    useExchangeRate: z.boolean(),
    applyCommission: z.boolean(),
    startingCapital: z.string(),
    buyCommission: z.string(),
    sellRate: z.string(),
    loopCount: z.string(),
    compoundProfits: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!isPositiveNumber(values.startingCapital)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startingCapital'],
        message: 'Starting capital must be greater than 0',
      })
    }

    if (!isPositiveNumber(values.sellRate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sellRate'],
        message: 'Sell rate must be greater than 0',
      })
    }

    if (!isPositiveInteger(values.loopCount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['loopCount'],
        message: 'Loop count must be a positive whole number',
      })
    }

    if (!isPositiveNumber(values.exchangeRate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exchangeRate'],
        message: 'Exchange rate must be greater than 0',
      })
    }

    const commissionRequired = !values.useExchangeRate || values.applyCommission
    if (commissionRequired && !isValidCommission(values.buyCommission)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['buyCommission'],
        message: 'Commission must be between 0 and 100',
      })
    }

    if (
      !values.useExchangeRate &&
      values.exchangeTaxPercent.trim() !== '' &&
      !isValidCommission(values.exchangeTaxPercent)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exchangeTaxPercent'],
        message: 'Exchange tax must be between 0 and 100',
      })
    }
  })

export type CalculateFormValues = z.infer<typeof calculateFormSchema>
