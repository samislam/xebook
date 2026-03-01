import { t } from 'elysia'

export const transactionTypeSchema = t.Union([t.Literal('BUY'), t.Literal('SELL')])
export const transactionCurrencySchema = t.Union([t.Literal('USD'), t.Literal('TRY')])
export const cycleNameSchema = t.String({ minLength: 1, maxLength: 100 })

export const createBuyTransactionBodySchema = t.Object({
  cycle: cycleNameSchema,
  type: t.Literal('BUY'),
  transactionValue: t.Number({ minimum: 0.0000001 }),
  transactionCurrency: transactionCurrencySchema,
  usdTryRateAtBuy: t.Optional(t.Number({ minimum: 0.0000001 })),
  occurredAt: t.Optional(t.String({ format: 'date-time' })),
  amountReceived: t.Number({ minimum: 0.0000001 }),
  commissionPercent: t.Optional(t.Number({ minimum: 0 })),
})

export const createSellTransactionBodySchema = t.Object({
  cycle: cycleNameSchema,
  type: t.Literal('SELL'),
  occurredAt: t.Optional(t.String({ format: 'date-time' })),
  amountSold: t.Number({ minimum: 0.0000001 }),
  amountReceived: t.Optional(t.Number({ minimum: 0.0000001 })),
  pricePerUnit: t.Optional(t.Number({ minimum: 0.0000001 })),
  commissionPercent: t.Optional(t.Number({ minimum: 0 })),
})

export const createTransactionBodySchema = t.Union([
  createBuyTransactionBodySchema,
  createSellTransactionBodySchema,
])

export const transactionResponseSchema = t.Object({
  id: t.String(),
  cycle: t.String(),
  type: transactionTypeSchema,
  occurredAt: t.String({ format: 'date-time' }),
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
  transactionValue: t.Union([t.Number(), t.Null()]),
  transactionCurrency: t.Union([transactionCurrencySchema, t.Null()]),
  usdTryRateAtBuy: t.Union([t.Number(), t.Null()]),
  amountReceived: t.Number(),
  amountSold: t.Union([t.Number(), t.Null()]),
  pricePerUnit: t.Union([t.Number(), t.Null()]),
  receivedCurrency: transactionCurrencySchema,
  commissionPercent: t.Union([t.Number(), t.Null()]),
  effectiveRateTry: t.Union([t.Number(), t.Null()]),
})

export const listTransactionsResponseSchema = t.Array(transactionResponseSchema)

export const createCycleBodySchema = t.Object({
  name: cycleNameSchema,
})

export const cycleParamsSchema = t.Object({
  id: t.String(),
})

export const updateCycleBodySchema = t.Object({
  name: cycleNameSchema,
})

export const cycleResponseSchema = t.Object({
  id: t.String(),
  name: cycleNameSchema,
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
})

export const listCyclesResponseSchema = t.Array(cycleResponseSchema)

export const deleteCycleResponseSchema = t.Object({
  success: t.Boolean(),
})

export const resetCycleResponseSchema = t.Object({
  success: t.Boolean(),
  deletedTransactions: t.Number(),
})

export const undoLastTransactionResponseSchema = t.Object({
  success: t.Boolean(),
  deletedTransactionId: t.String(),
})
