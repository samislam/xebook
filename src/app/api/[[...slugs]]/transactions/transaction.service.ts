import { Prisma } from '@/generated/prisma'
import { prismaClient } from '@/lib/prisma/prisma-client'

type BuyInput = {
  type: 'BUY'
  transactionValue: number
  transactionCurrency: 'USD' | 'TRY'
  occurredAt?: string
  amountReceived: number
}

type SellInput = {
  type: 'SELL'
  occurredAt?: string
  amountSold: number
  amountReceived?: number
  pricePerUnit?: number
}

type CreateTransactionInput = BuyInput | SellInput

const decimalToNumber = (value: Prisma.Decimal | null | undefined) =>
  value === null || value === undefined ? null : Number(value)

const toPlainTransaction = (row: {
  id: string
  type: 'BUY' | 'SELL'
  occurredAt: Date
  createdAt: Date
  updatedAt: Date
  transactionValue: Prisma.Decimal | null
  transactionCurrency: 'USD' | 'TRY' | null
  amountReceived: Prisma.Decimal
  amountSold: Prisma.Decimal | null
  pricePerUnit: Prisma.Decimal | null
  receivedCurrency: 'USD' | 'TRY'
  commissionPercent: Prisma.Decimal | null
  effectiveRateTry: Prisma.Decimal | null
}) => ({
  id: row.id,
  type: row.type,
  occurredAt: row.occurredAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  transactionValue: decimalToNumber(row.transactionValue),
  transactionCurrency: row.transactionCurrency,
  amountReceived: Number(row.amountReceived),
  amountSold: decimalToNumber(row.amountSold),
  pricePerUnit: decimalToNumber(row.pricePerUnit),
  receivedCurrency: row.receivedCurrency,
  commissionPercent: decimalToNumber(row.commissionPercent),
  effectiveRateTry: decimalToNumber(row.effectiveRateTry),
})

export class TransactionService {
  async listTransactions() {
    const rows = await prismaClient.tradeTransaction.findMany({
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(toPlainTransaction)
  }

  async createTransaction(input: CreateTransactionInput) {
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date()

    if (input.type === 'BUY') {
      const effectiveRateTry =
        input.transactionCurrency === 'TRY' ? input.transactionValue / input.amountReceived : null

      const commissionPercent =
        input.transactionCurrency === 'USD'
          ? ((input.transactionValue - input.amountReceived) / input.transactionValue) * 100
          : null

      const row = await prismaClient.tradeTransaction.create({
        data: {
          type: 'BUY',
          occurredAt,
          transactionValue: input.transactionValue,
          transactionCurrency: input.transactionCurrency,
          amountReceived: input.amountReceived,
          receivedCurrency: 'TRY',
          commissionPercent,
          effectiveRateTry,
        },
      })

      return toPlainTransaction(row)
    }

    const amountReceived =
      input.amountReceived ?? (input.pricePerUnit as number | undefined)! * input.amountSold
    const pricePerUnit = input.pricePerUnit ?? amountReceived / input.amountSold

    const row = await prismaClient.tradeTransaction.create({
      data: {
        type: 'SELL',
        occurredAt,
        amountSold: input.amountSold,
        amountReceived,
        pricePerUnit,
        receivedCurrency: 'TRY',
        effectiveRateTry: pricePerUnit,
      },
    })

    return toPlainTransaction(row)
  }
}

export const transactionService = new TransactionService()
