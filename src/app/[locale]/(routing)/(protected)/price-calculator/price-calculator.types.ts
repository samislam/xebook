export const CURRENCIES = ['SYP', 'TRY', 'USD', 'USDT'] as const
export type Currency = (typeof CURRENCIES)[number]

export const STEP_TYPES = ['EXPENSE', 'CONVERSION'] as const
export type StepType = (typeof STEP_TYPES)[number]
export const EXIT_MODES = ['PERCENT', 'PRICE'] as const
export type ExitMode = (typeof EXIT_MODES)[number]

export type ScenarioStep = {
  type: StepType
  label: string
  fromCurrency: Currency
  toCurrency: Currency
  fromAmount: string
  toAmount: string
  fixedFee: string
  percentFee: string
  includeInUsdtCostBasis: boolean
  note: string
}

export type CostVector = Record<Exclude<Currency, 'USDT'>, number>

export type Rates = {
  usdToSyp: number | null
  usdToTry: number | null
}

export type StepPreview = {
  label: string
  description: string
  netSourceAmount: number
  outputAmount: number | null
}

export type PriceCalculatorSummary = {
  currentHoldings: Record<Currency, number>
  usdtHoldings: number
  includedExpenseVector: CostVector
  usdtCostVector: CostVector
  effectivePricePerUsdt: {
    USD: number | null
    SYP: number | null
    TRY: number | null
  }
  weightedUsdBridgeRate: number | null
  targetSell: {
    currency: Currency
    exitMode: ExitMode
    usdtAmount: number
    profitPercent: number | null
    previousCapital: number | null
    newCapital: number | null
    netPricePerUsdt: number | null
    grossPricePerUsdt: number | null
    netTotal: number | null
    grossTotal: number | null
    targetProfitAmount: number | null
    premiumPercent: number | null
  }
  previews: StepPreview[]
  warnings: string[]
}
