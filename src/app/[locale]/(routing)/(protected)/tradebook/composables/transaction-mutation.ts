'use client'

import type { TradebookTransactionFormValues } from '../schemas/transaction-form.schema'
import { formatUsdt } from '../tradebook.utils'
import type { CycleOption, TradeTransaction, TransactionType } from '../tradebook.types'

export type TradeTransactionRecord = Pick<
  TradeTransaction,
  'id' | 'cycle' | 'type' | 'occurredAt' | 'createdAt'
>

type BuyPayload = {
  cycle: string
  type: 'BUY'
  transactionValue: number
  transactionCurrency: 'USD' | 'TRY'
  usdTryRateAtBuy?: number
  occurredAt: string
  amountReceived: number
  commissionPercent?: number
  description?: string
  payingWithCash: boolean
  senderInstitution?: string
  senderIban?: string
  senderName?: string
  recipientInstitution?: string
  recipientIban?: string
  recipientName?: string
}

type SellPayload = {
  cycle: string
  type: 'SELL'
  occurredAt: string
  amountSold: number
  amountReceived?: number
  pricePerUnit?: number
  commissionPercent?: number
  description?: string
  payingWithCash: boolean
  senderInstitution?: string
  senderIban?: string
  senderName?: string
  recipientInstitution?: string
  recipientIban?: string
  recipientName?: string
}

type CycleSettlementPayload = {
  type: 'CYCLE_SETTLEMENT'
  occurredAt: string
  fromCycle: string
  toCycle: string
  amount: number
  description?: string
}

type BalanceCorrectionPayload = {
  cycle: string
  type: 'DEPOSIT_BALANCE_CORRECTION' | 'WITHDRAW_BALANCE_CORRECTION'
  occurredAt: string
  amount: number
  description?: string
}

export type CreateTransactionPayload =
  | BuyPayload
  | SellPayload
  | CycleSettlementPayload
  | BalanceCorrectionPayload

export type UpdateTransactionPayload = Exclude<CreateTransactionPayload, CycleSettlementPayload>

type BuildPayloadResult =
  | { payload: CreateTransactionPayload; error: null }
  | { payload: null; error: string }

export const getSubmissionErrorMessage = (error: { value?: unknown } | null, fallback: string) =>
  (error?.value as { error?: string } | null)?.error ?? fallback

export const requiresUnsafeEditConfirmation = (
  editingTransaction: TradeTransactionRecord | null,
  transactions: TradeTransactionRecord[]
) => {
  if (!editingTransaction || editingTransaction.type === 'CYCLE_SETTLEMENT') return false

  const cycleTransactions = transactions
    .filter((transaction) => transaction.cycle === editingTransaction.cycle)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  return cycleTransactions[0]?.id !== editingTransaction.id
}

export const buildTransactionPayload = ({
  values,
  cycleOptions,
  getCycleUsdtBalance,
}: {
  values: TradebookTransactionFormValues
  cycleOptions: CycleOption[]
  getCycleUsdtBalance: (cycleName: string) => number
}): BuildPayloadResult => {
  const effectiveCycle = values.transactionCycle.trim()
  const occurredAt = values.occurredAt
  const occurredAtIso = new Date(occurredAt).toISOString()

  if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) {
    return { payload: null, error: 'Please provide a valid date and time' }
  }

  if (!effectiveCycle) {
    return { payload: null, error: 'Cycle is required' }
  }

  if (!cycleOptions.some((cycleItem) => cycleItem.name === effectiveCycle)) {
    return { payload: null, error: 'Please select a valid cycle from the list' }
  }

  const payload: CreateTransactionPayload =
    values.transactionType === 'BUY'
      ? (() => {
          const transactionValueNumber = Number.parseFloat(values.transactionValue)
          const buyAmountReceivedNumber = Number.parseFloat(values.buyAmountReceived)
          const buyPricePerUnitNumber = Number.parseFloat(values.buyPricePerUnit)
          const usdTryRateAtBuyNumber =
            values.transactionCurrency === 'USD' && values.buyUsdTryRateAtBuy
              ? Number.parseFloat(values.buyUsdTryRateAtBuy)
              : undefined
          const buyFeeNumber = values.buyFee ? Number.parseFloat(values.buyFee) : undefined
          const totalTrySpent =
            values.transactionCurrency === 'TRY'
              ? transactionValueNumber
              : values.transactionCurrency === 'USD' && usdTryRateAtBuyNumber
                ? transactionValueNumber * usdTryRateAtBuyNumber
                : Number.NaN

          const grossBoughtUsdt =
            values.buyInputMode === 'price-per-unit' &&
            Number.isFinite(buyPricePerUnitNumber) &&
            buyPricePerUnitNumber > 0 &&
            Number.isFinite(totalTrySpent)
              ? totalTrySpent / buyPricePerUnitNumber
              : Number.NaN

          const normalizedBuyAmountReceived =
            values.buyInputMode === 'amount-received'
              ? buyAmountReceivedNumber
              : Number.isFinite(grossBoughtUsdt)
                ? values.buyFeeUnit === 'percent'
                  ? buyFeeNumber !== undefined
                    ? grossBoughtUsdt * (1 - buyFeeNumber / 100)
                    : grossBoughtUsdt
                  : buyFeeNumber !== undefined
                    ? grossBoughtUsdt - buyFeeNumber
                    : grossBoughtUsdt
                : Number.NaN

          const buyCommissionPercent = (() => {
            if (buyFeeNumber === undefined) return undefined
            if (!Number.isFinite(buyFeeNumber)) return Number.NaN
            if (values.buyFeeUnit === 'percent') return buyFeeNumber

            if (values.buyInputMode === 'price-per-unit' && Number.isFinite(grossBoughtUsdt)) {
              if (!Number.isFinite(grossBoughtUsdt) || grossBoughtUsdt <= 0) return Number.NaN
              return (buyFeeNumber / grossBoughtUsdt) * 100
            }

            const receivedUsdt = buyAmountReceivedNumber
            if (!Number.isFinite(receivedUsdt)) return Number.NaN
            const grossUsdt = receivedUsdt + buyFeeNumber
            if (!Number.isFinite(grossUsdt) || grossUsdt <= 0) return Number.NaN
            return (buyFeeNumber / grossUsdt) * 100
          })()

          return {
            cycle: effectiveCycle,
            type: 'BUY',
            transactionValue: transactionValueNumber,
            transactionCurrency: values.transactionCurrency,
            usdTryRateAtBuy: usdTryRateAtBuyNumber,
            occurredAt: occurredAtIso,
            amountReceived: normalizedBuyAmountReceived,
            commissionPercent: buyCommissionPercent,
            description: values.transactionDescription.trim() || undefined,
            payingWithCash: values.payingWithCash,
            senderInstitution: values.payingWithCash
              ? undefined
              : values.senderInstitution.trim() || undefined,
            senderIban: values.payingWithCash ? undefined : values.senderIban.trim() || undefined,
            senderName: values.payingWithCash ? undefined : values.senderName.trim() || undefined,
            recipientInstitution: values.payingWithCash
              ? undefined
              : values.recipientInstitution.trim() || undefined,
            recipientIban: values.payingWithCash
              ? undefined
              : values.recipientIban.trim() || undefined,
            recipientName: values.payingWithCash
              ? undefined
              : values.recipientName.trim() || undefined,
          }
        })()
      : values.transactionType === 'SELL'
        ? {
            cycle: effectiveCycle,
            type: 'SELL',
            occurredAt: occurredAtIso,
            amountSold: Number.parseFloat(values.sellAmountSold),
            amountReceived:
              values.sellInputMode === 'amount-received' && values.sellAmountReceived
                ? Number.parseFloat(values.sellAmountReceived)
                : undefined,
            pricePerUnit:
              values.sellInputMode === 'price-per-unit' && values.sellPricePerUnit
                ? Number.parseFloat(values.sellPricePerUnit)
                : undefined,
            commissionPercent: (() => {
              if (!values.sellFee) return undefined
              const feeValue = Number.parseFloat(values.sellFee)
              if (!Number.isFinite(feeValue)) return Number.NaN
              if (values.sellFeeUnit === 'percent') return feeValue

              const soldUsdt = Number.parseFloat(values.sellAmountSold)
              if (!Number.isFinite(soldUsdt) || soldUsdt <= 0) return Number.NaN
              return (feeValue / soldUsdt) * 100
            })(),
            description: values.transactionDescription.trim() || undefined,
            payingWithCash: values.payingWithCash,
            senderInstitution: values.payingWithCash
              ? undefined
              : values.senderInstitution.trim() || undefined,
            senderIban: values.payingWithCash ? undefined : values.senderIban.trim() || undefined,
            senderName: values.payingWithCash ? undefined : values.senderName.trim() || undefined,
            recipientInstitution: values.payingWithCash
              ? undefined
              : values.recipientInstitution.trim() || undefined,
            recipientIban: values.payingWithCash
              ? undefined
              : values.recipientIban.trim() || undefined,
            recipientName: values.payingWithCash
              ? undefined
              : values.recipientName.trim() || undefined,
          }
        : values.transactionType === 'CYCLE_SETTLEMENT'
          ? {
              type: 'CYCLE_SETTLEMENT',
              occurredAt: occurredAtIso,
              fromCycle: effectiveCycle,
              toCycle: values.settlementToCycle.trim(),
              amount: Number.parseFloat(values.settlementAmount),
              description: values.transactionDescription.trim() || undefined,
            }
          : {
              cycle: effectiveCycle,
              type:
                values.transactionType === 'DEPOSIT_BALANCE_CORRECTION'
                  ? 'DEPOSIT_BALANCE_CORRECTION'
                  : 'WITHDRAW_BALANCE_CORRECTION',
              occurredAt: occurredAtIso,
              amount: Number.parseFloat(values.correctionAmount),
              description: values.transactionDescription.trim() || undefined,
            }

  if (payload.type === 'BUY') {
    if (!Number.isFinite(payload.transactionValue) || payload.transactionValue <= 0) {
      return { payload: null, error: 'Transaction value must be greater than 0' }
    }
    if (!Number.isFinite(payload.amountReceived) || payload.amountReceived <= 0) {
      return {
        payload: null,
        error:
          values.buyInputMode === 'price-per-unit'
            ? 'Price per unit and fee produce an invalid received amount'
            : 'Amount received must be greater than 0',
      }
    }
    if (values.buyInputMode === 'price-per-unit') {
      const buyPricePerUnitValue = Number.parseFloat(values.buyPricePerUnit)
      if (!Number.isFinite(buyPricePerUnitValue) || buyPricePerUnitValue <= 0) {
        return { payload: null, error: 'Price per unit must be greater than 0' }
      }
    }
    if (payload.transactionCurrency === 'USD') {
      if (!payload.usdTryRateAtBuy) {
        return { payload: null, error: 'USD/TRY rate at buy is required for USD buys' }
      }
      if (!Number.isFinite(payload.usdTryRateAtBuy) || payload.usdTryRateAtBuy <= 0) {
        return { payload: null, error: 'USD/TRY rate at buy must be greater than 0' }
      }
    }
    if (
      payload.commissionPercent !== undefined &&
      (!Number.isFinite(payload.commissionPercent) ||
        payload.commissionPercent < 0 ||
        payload.commissionPercent >= 100)
    ) {
      return { payload: null, error: 'Fee must be between 0 and less than 100' }
    }
  } else if (payload.type === 'SELL') {
    if (!Number.isFinite(payload.amountSold) || payload.amountSold <= 0) {
      return { payload: null, error: 'Amount sold must be greater than 0' }
    }
    if (values.sellInputMode === 'amount-received' && !payload.amountReceived) {
      return { payload: null, error: 'For SELL, provide amount received' }
    }
    if (values.sellInputMode === 'price-per-unit' && !payload.pricePerUnit) {
      return { payload: null, error: 'For SELL, provide price per unit' }
    }
    if (
      payload.amountReceived &&
      (!Number.isFinite(payload.amountReceived) || payload.amountReceived <= 0)
    ) {
      return { payload: null, error: 'Amount received must be greater than 0' }
    }
    if (
      payload.pricePerUnit &&
      (!Number.isFinite(payload.pricePerUnit) || payload.pricePerUnit <= 0)
    ) {
      return { payload: null, error: 'Price per unit must be greater than 0' }
    }
    if (
      payload.commissionPercent !== undefined &&
      (!Number.isFinite(payload.commissionPercent) || payload.commissionPercent < 0)
    ) {
      return { payload: null, error: 'Fee must be 0 or greater' }
    }
  } else if (payload.type === 'CYCLE_SETTLEMENT') {
    if (!payload.fromCycle) {
      return { payload: null, error: 'Source cycle is required' }
    }
    if (!payload.toCycle) {
      return { payload: null, error: 'Destination cycle is required' }
    }
    if (payload.fromCycle === payload.toCycle) {
      return { payload: null, error: 'Source and destination cycles must be different' }
    }
    if (!cycleOptions.some((cycleItem) => cycleItem.name === payload.toCycle)) {
      return {
        payload: null,
        error: 'Please select a valid destination cycle from the list',
      }
    }
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return { payload: null, error: 'Settlement amount must be greater than 0' }
    }
    const sourceBalance = Math.max(0, getCycleUsdtBalance(payload.fromCycle))
    if (payload.amount > sourceBalance + Number.EPSILON) {
      return {
        payload: null,
        error: `Settlement amount exceeds source cycle balance (${formatUsdt(sourceBalance)} USDT)`,
      }
    }
  } else {
    if (!payload.cycle) {
      return { payload: null, error: 'Cycle is required' }
    }
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return { payload: null, error: 'Correction amount must be greater than 0' }
    }
    if (payload.type === 'WITHDRAW_BALANCE_CORRECTION') {
      const cycleBalance = Math.max(0, getCycleUsdtBalance(payload.cycle))
      if (payload.amount > cycleBalance + Number.EPSILON) {
        return {
          payload: null,
          error: `Withdraw correction exceeds cycle balance (${formatUsdt(cycleBalance)} USDT)`,
        }
      }
    }
  }

  return { payload, error: null }
}
