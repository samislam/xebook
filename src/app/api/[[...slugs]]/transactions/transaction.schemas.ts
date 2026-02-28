import { t } from 'elysia'

export const transactionTypeSchema = t.Union([t.Literal('BUY'), t.Literal('SELL')])
export const transactionCurrencySchema = t.Union([t.Literal('USD'), t.Literal('TRY')])

export const createBuyTransactionBodySchema = t.Object({
  type: t.Literal('BUY'),
  transactionValue: t.Number({ minimum: 0.0000001 }),
  transactionCurrency: transactionCurrencySchema,
  occurredAt: t.Optional(t.String({ format: 'date-time' })),
  amountReceived: t.Number({ minimum: 0.0000001 }),
})

export const createSellTransactionBodySchema = t.Object({
  type: t.Literal('SELL'),
  occurredAt: t.Optional(t.String({ format: 'date-time' })),
  amountSold: t.Number({ minimum: 0.0000001 }),
  amountReceived: t.Optional(t.Number({ minimum: 0.0000001 })),
  pricePerUnit: t.Optional(t.Number({ minimum: 0.0000001 })),
})

export const createTransactionBodySchema = t.Union([
  createBuyTransactionBodySchema,
  createSellTransactionBodySchema,
])

export const transactionResponseSchema = t.Object({
  id: t.String(),
  type: transactionTypeSchema,
  occurredAt: t.String({ format: 'date-time' }),
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
  transactionValue: t.Union([t.Number(), t.Null()]),
  transactionCurrency: t.Union([transactionCurrencySchema, t.Null()]),
  amountReceived: t.Number(),
  amountSold: t.Union([t.Number(), t.Null()]),
  pricePerUnit: t.Union([t.Number(), t.Null()]),
  receivedCurrency: transactionCurrencySchema,
  commissionPercent: t.Union([t.Number(), t.Null()]),
  effectiveRateTry: t.Union([t.Number(), t.Null()]),
})

export const listTransactionsResponseSchema = t.Array(transactionResponseSchema)
