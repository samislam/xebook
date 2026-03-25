import { z } from 'zod'
import type { ScenarioStep } from './price-calculator.types'

export const currencySchema = z.enum(['SYP', 'TRY', 'USD', 'USDT'])
export const stepTypeSchema = z.enum(['EXPENSE', 'CONVERSION'])
export const exitModeSchema = z.enum(['PERCENT', 'PRICE'])

export const scenarioStepSchema = z.object({
  type: stepTypeSchema,
  label: z.string(),
  fromCurrency: currencySchema,
  toCurrency: currencySchema,
  fromAmount: z.string(),
  toAmount: z.string(),
  fixedFee: z.string(),
  percentFee: z.string(),
  includeInUsdtCostBasis: z.boolean(),
  note: z.string(),
})

export const priceCalculatorSchema = z.object({
  scenarioName: z.string(),
  usdToSypRate: z.string(),
  usdToTryRate: z.string(),
  targetSellCurrency: currencySchema,
  targetExitMode: exitModeSchema,
  targetUsdtAmount: z.string(),
  targetProfitPercent: z.string(),
  targetSellPricePerUsdt: z.string(),
  targetSellFeePercent: z.string(),
  targetSellFeeFixed: z.string(),
  steps: z.array(scenarioStepSchema),
})

export type PriceCalculatorValues = z.infer<typeof priceCalculatorSchema>

export const createExpenseStep = (overrides?: Partial<ScenarioStep>): ScenarioStep => ({
  type: 'EXPENSE',
  label: 'Cashout or manual expense',
  fromCurrency: 'SYP',
  toCurrency: 'USDT',
  fromAmount: '',
  toAmount: '',
  fixedFee: '0',
  percentFee: '0',
  includeInUsdtCostBasis: true,
  note: '',
  ...overrides,
})

export const createConversionStep = (overrides?: Partial<ScenarioStep>): ScenarioStep => ({
  type: 'CONVERSION',
  label: 'Conversion',
  fromCurrency: 'SYP',
  toCurrency: 'USD',
  fromAmount: '',
  toAmount: '',
  fixedFee: '0',
  percentFee: '0',
  includeInUsdtCostBasis: true,
  note: '',
  ...overrides,
})

export const PRICE_CALCULATOR_DEFAULT_VALUES: PriceCalculatorValues = {
  scenarioName: '',
  usdToSypRate: '',
  usdToTryRate: '',
  targetSellCurrency: 'SYP',
  targetExitMode: 'PERCENT',
  targetUsdtAmount: '',
  targetProfitPercent: '',
  targetSellPricePerUsdt: '',
  targetSellFeePercent: '0',
  targetSellFeeFixed: '0',
  steps: [],
}
