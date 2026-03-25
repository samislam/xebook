import type { ScenarioStep } from './price-calculator.types'
import { createConversionStep, createExpenseStep } from './price-calculator.schema'

export type PriceCalculatorPreset = {
  id: string
  label: string
  description: string
  steps: ScenarioStep[]
}

export const PRICE_CALCULATOR_PRESETS: PriceCalculatorPreset[] = [
  {
    id: 'cashout',
    label: 'Cashout',
    description: 'Wallet cashout, hand fee, or any local expense before trading.',
    steps: [
      createExpenseStep({
        label: 'Cashout expense',
        fromCurrency: 'SYP',
      }),
    ],
  },
  {
    id: 'buy-usd-syp',
    label: 'Buy USD with SYP',
    description: 'Convert SYP directly into USD.',
    steps: [
      createConversionStep({
        label: 'Buy USD',
        fromCurrency: 'SYP',
        toCurrency: 'USD',
      }),
    ],
  },
  {
    id: 'buy-usd-try',
    label: 'Buy USD with TRY',
    description: 'Convert TRY directly into USD.',
    steps: [
      createConversionStep({
        label: 'Buy USD',
        fromCurrency: 'TRY',
        toCurrency: 'USD',
      }),
    ],
  },
  {
    id: 'buy-usdt-usd',
    label: 'Buy USDT with USD',
    description: 'Convert USD directly into USDT.',
    steps: [
      createConversionStep({
        label: 'Buy USDT',
        fromCurrency: 'USD',
        toCurrency: 'USDT',
      }),
    ],
  },
  {
    id: 'buy-usdt-syp',
    label: 'Buy USDT with SYP',
    description: 'Direct local-currency buy without a USD bridge.',
    steps: [
      createConversionStep({
        label: 'Buy USDT',
        fromCurrency: 'SYP',
        toCurrency: 'USDT',
      }),
    ],
  },
  {
    id: 'buy-usdt-try',
    label: 'Buy USDT with TRY',
    description: 'Direct local-currency buy without a USD bridge.',
    steps: [
      createConversionStep({
        label: 'Buy USDT',
        fromCurrency: 'TRY',
        toCurrency: 'USDT',
      }),
    ],
  },
  {
    id: 'syp-usd-usdt',
    label: 'SYP -> USD -> USDT',
    description: 'Classic bridge flow when you first buy USD then convert to USDT.',
    steps: [
      createConversionStep({
        label: 'Buy USD',
        fromCurrency: 'SYP',
        toCurrency: 'USD',
      }),
      createConversionStep({
        label: 'Buy USDT',
        fromCurrency: 'USD',
        toCurrency: 'USDT',
      }),
    ],
  },
  {
    id: 'try-usd-usdt',
    label: 'TRY -> USD -> USDT',
    description: 'Bridge TRY into USD first, then convert to USDT.',
    steps: [
      createConversionStep({
        label: 'Buy USD',
        fromCurrency: 'TRY',
        toCurrency: 'USD',
      }),
      createConversionStep({
        label: 'Buy USDT',
        fromCurrency: 'USD',
        toCurrency: 'USDT',
      }),
    ],
  },
  {
    id: 'sell-usdt-syp',
    label: 'Sell USDT into SYP',
    description: 'Plan a direct USDT cashout into SYP.',
    steps: [
      createConversionStep({
        label: 'Sell USDT',
        fromCurrency: 'USDT',
        toCurrency: 'SYP',
        includeInUsdtCostBasis: false,
      }),
    ],
  },
  {
    id: 'sell-usdt-try',
    label: 'Sell USDT into TRY',
    description: 'Plan a direct USDT cashout into TRY.',
    steps: [
      createConversionStep({
        label: 'Sell USDT',
        fromCurrency: 'USDT',
        toCurrency: 'TRY',
        includeInUsdtCostBasis: false,
      }),
    ],
  },
  {
    id: 'sell-usdt-usd',
    label: 'Sell USDT into USD',
    description: 'Plan a direct USDT cashout into USD.',
    steps: [
      createConversionStep({
        label: 'Sell USDT',
        fromCurrency: 'USDT',
        toCurrency: 'USD',
        includeInUsdtCostBasis: false,
      }),
    ],
  },
  {
    id: 'manual-adjustment',
    label: 'Pocket adjustment',
    description: 'Money you kept aside or manually removed from the trade flow.',
    steps: [
      createExpenseStep({
        label: 'Pocket adjustment',
        fromCurrency: 'SYP',
        includeInUsdtCostBasis: false,
      }),
    ],
  },
]
