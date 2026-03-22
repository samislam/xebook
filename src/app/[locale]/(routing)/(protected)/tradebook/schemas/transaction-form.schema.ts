import { z } from 'zod'

export const transactionTypeSchema = z.enum([
  'BUY',
  'SELL',
  'CYCLE_SETTLEMENT',
  'DEPOSIT_BALANCE_CORRECTION',
  'WITHDRAW_BALANCE_CORRECTION',
])

export const transactionCurrencySchema = z.enum(['USD', 'TRY'])
export const buyInputModeSchema = z.enum(['amount-received', 'price-per-unit'])
export const sellInputModeSchema = z.enum(['amount-received', 'price-per-unit'])
export const feeUnitSchema = z.enum(['percent', 'usdt'])

export const transactionFormSchema = z.object({
  transactionType: transactionTypeSchema,
  transactionCycle: z.string(),
  transactionCurrency: transactionCurrencySchema,
  occurredAt: z.string().min(1, 'Datetime is required'),
  transactionValue: z.string(),
  buyInputMode: buyInputModeSchema,
  buyAmountReceived: z.string(),
  buyPricePerUnit: z.string(),
  buyUsdTryRateAtBuy: z.string(),
  buyFee: z.string(),
  buyFeeUnit: feeUnitSchema,
  sellAmountSold: z.string(),
  sellAmountReceived: z.string(),
  sellPricePerUnit: z.string(),
  sellFee: z.string(),
  sellFeeUnit: feeUnitSchema,
  sellInputMode: sellInputModeSchema,
  settlementToCycle: z.string(),
  settlementAmount: z.string(),
  transactionDescription: z.string(),
  correctionAmount: z.string(),
  senderInstitution: z.string(),
  senderIban: z.string(),
  senderName: z.string(),
  recipientInstitution: z.string(),
  recipientIban: z.string(),
  recipientName: z.string(),
  payingWithCash: z.boolean(),
})

export type TradebookTransactionFormValues = z.infer<typeof transactionFormSchema>
