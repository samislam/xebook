import { z } from 'zod'

export const transactionTypeSchema = z.union([
  z.literal('BUY'),
  z.literal('SELL'),
  z.literal('CYCLE_SETTLEMENT'),
  z.literal('DEPOSIT_BALANCE_CORRECTION'),
  z.literal('WITHDRAW_BALANCE_CORRECTION'),
])

export const transactionCurrencySchema = z.union([z.literal('USD'), z.literal('TRY')])
export const cycleNameSchema = z.string().trim().min(1).max(100)
const optionalPartyTextSchema = z.string().trim().min(1).max(255).optional()
const optionalDescriptionSchema = z.string().trim().min(1).max(2000).optional()
const dateTimeStringSchema = z.string().datetime()

export const createBuyTransactionBodySchema = z.object({
  cycle: cycleNameSchema,
  type: z.literal('BUY'),
  transactionValue: z.number().positive(),
  transactionCurrency: transactionCurrencySchema,
  usdTryRateAtBuy: z.number().positive().optional(),
  occurredAt: dateTimeStringSchema.optional(),
  amountReceived: z.number().positive(),
  commissionPercent: z.number().min(0).optional(),
  description: optionalDescriptionSchema,
  payingWithCash: z.boolean().optional(),
  senderInstitution: optionalPartyTextSchema,
  senderIban: optionalPartyTextSchema,
  senderName: optionalPartyTextSchema,
  recipientInstitution: optionalPartyTextSchema,
  recipientIban: optionalPartyTextSchema,
  recipientName: optionalPartyTextSchema,
})

export const createSellTransactionBodySchema = z.object({
  cycle: cycleNameSchema,
  type: z.literal('SELL'),
  occurredAt: dateTimeStringSchema.optional(),
  amountSold: z.number().positive(),
  amountReceived: z.number().positive().optional(),
  pricePerUnit: z.number().positive().optional(),
  commissionPercent: z.number().min(0).optional(),
  description: optionalDescriptionSchema,
  payingWithCash: z.boolean().optional(),
  senderInstitution: optionalPartyTextSchema,
  senderIban: optionalPartyTextSchema,
  senderName: optionalPartyTextSchema,
  recipientInstitution: optionalPartyTextSchema,
  recipientIban: optionalPartyTextSchema,
  recipientName: optionalPartyTextSchema,
})

export const createCycleSettlementTransactionBodySchema = z.object({
  type: z.literal('CYCLE_SETTLEMENT'),
  fromCycle: cycleNameSchema,
  toCycle: cycleNameSchema,
  occurredAt: dateTimeStringSchema.optional(),
  amount: z.number().positive(),
  description: optionalDescriptionSchema,
})

export const createDepositBalanceCorrectionBodySchema = z.object({
  cycle: cycleNameSchema,
  type: z.literal('DEPOSIT_BALANCE_CORRECTION'),
  occurredAt: dateTimeStringSchema.optional(),
  amount: z.number().positive(),
  description: optionalDescriptionSchema,
})

export const createWithdrawBalanceCorrectionBodySchema = z.object({
  cycle: cycleNameSchema,
  type: z.literal('WITHDRAW_BALANCE_CORRECTION'),
  occurredAt: dateTimeStringSchema.optional(),
  amount: z.number().positive(),
  description: optionalDescriptionSchema,
})

export const createTransactionBodySchema = z.union([
  createBuyTransactionBodySchema,
  createSellTransactionBodySchema,
  createCycleSettlementTransactionBodySchema,
  createDepositBalanceCorrectionBodySchema,
  createWithdrawBalanceCorrectionBodySchema,
])

export const updateTransactionBodySchema = z.union([
  createBuyTransactionBodySchema,
  createSellTransactionBodySchema,
  createDepositBalanceCorrectionBodySchema,
  createWithdrawBalanceCorrectionBodySchema,
])

export const transactionResponseSchema = z.object({
  id: z.string(),
  cycle: z.string(),
  type: transactionTypeSchema,
  occurredAt: dateTimeStringSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
  transactionValue: z.number().nullable(),
  transactionCurrency: transactionCurrencySchema.nullable(),
  usdTryRateAtBuy: z.number().nullable(),
  amountReceived: z.number(),
  amountSold: z.number().nullable(),
  pricePerUnit: z.number().nullable(),
  receivedCurrency: transactionCurrencySchema,
  commissionPercent: z.number().nullable(),
  effectiveRateTry: z.number().nullable(),
  description: z.string().nullable(),
  payingWithCash: z.boolean(),
  senderInstitution: z.string().nullable(),
  senderIban: z.string().nullable(),
  senderName: z.string().nullable(),
  recipientInstitution: z.string().nullable(),
  recipientIban: z.string().nullable(),
  recipientName: z.string().nullable(),
})

export const listTransactionsResponseSchema = z.array(transactionResponseSchema)

export const createCycleBodySchema = z.object({
  name: cycleNameSchema,
})

export const createInstitutionBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  icon: z.any().optional(),
})

export const institutionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconFileName: z.string().nullable(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
})

export const listInstitutionsResponseSchema = z.array(institutionResponseSchema)

export const cycleParamsSchema = z.object({
  id: z.string(),
})

export const transactionParamsSchema = z.object({
  id: z.string(),
})

export const institutionIconParamsSchema = z.object({
  fileName: z.string().min(1),
})

export const updateCycleBodySchema = z.object({
  name: cycleNameSchema,
})

export const cycleResponseSchema = z.object({
  id: z.string(),
  name: cycleNameSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
})

export const listCyclesResponseSchema = z.array(cycleResponseSchema)

export const deleteCycleResponseSchema = z.object({
  success: z.boolean(),
})

export const resetCycleResponseSchema = z.object({
  success: z.boolean(),
  deletedTransactions: z.number(),
})

export const undoLastTransactionResponseSchema = z.object({
  success: z.boolean(),
  deletedTransactionId: z.string(),
})

export const deleteTransactionResponseSchema = z.object({
  success: z.boolean(),
  deletedTransactionId: z.string(),
})

export const createTransactionResponseSchema = z.union([
  transactionResponseSchema,
  z.array(transactionResponseSchema),
])

export const updateTransactionResponseSchema = transactionResponseSchema
