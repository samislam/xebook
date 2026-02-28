import { Prisma } from '@/generated/prisma'
import { prismaClient } from '@/lib/prisma/prisma-client'

type BuyInput = {
  cycle: string
  type: 'BUY'
  transactionValue: number
  transactionCurrency: 'USD' | 'TRY'
  usdTryRateAtBuy?: number
  occurredAt?: string
  amountReceived: number
}

type SellInput = {
  cycle: string
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
  cycle: { name: string }
  type: 'BUY' | 'SELL'
  occurredAt: Date
  createdAt: Date
  updatedAt: Date
  transactionValue: Prisma.Decimal | null
  transactionCurrency: 'USD' | 'TRY' | null
  usdTryRateAtBuy: Prisma.Decimal | null
  amountReceived: Prisma.Decimal
  amountSold: Prisma.Decimal | null
  pricePerUnit: Prisma.Decimal | null
  receivedCurrency: 'USD' | 'TRY'
  commissionPercent: Prisma.Decimal | null
  effectiveRateTry: Prisma.Decimal | null
}) => ({
  id: row.id,
  cycle: row.cycle.name,
  type: row.type,
  occurredAt: row.occurredAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  transactionValue: decimalToNumber(row.transactionValue),
  transactionCurrency: row.transactionCurrency,
  usdTryRateAtBuy: decimalToNumber(row.usdTryRateAtBuy),
  amountReceived: Number(row.amountReceived),
  amountSold: decimalToNumber(row.amountSold),
  pricePerUnit: decimalToNumber(row.pricePerUnit),
  receivedCurrency: row.receivedCurrency,
  commissionPercent: decimalToNumber(row.commissionPercent),
  effectiveRateTry: decimalToNumber(row.effectiveRateTry),
})

export class TransactionService {
  async listCycles() {
    const cycles = await prismaClient.tradeCycle.findMany({
      orderBy: { createdAt: 'asc' },
    })

    return cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
    }))
  }

  async createCycle(name: string) {
    const normalizedName = name.trim()
    const cycle = await prismaClient.tradeCycle.upsert({
      where: { name: normalizedName },
      create: { name: normalizedName },
      update: {},
    })

    return {
      id: cycle.id,
      name: cycle.name,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
    }
  }

  async renameCycle(id: string, name: string) {
    const normalizedName = name.trim()
    const cycle = await prismaClient.tradeCycle.update({
      where: { id },
      data: { name: normalizedName },
    })

    return {
      id: cycle.id,
      name: cycle.name,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
    }
  }

  async deleteCycle(id: string) {
    const transactionsCount = await prismaClient.tradeTransaction.count({
      where: { cycleId: id },
    })

    if (transactionsCount > 0) {
      throw new Error('Cannot delete a cycle that has transactions')
    }

    await prismaClient.tradeCycle.delete({
      where: { id },
    })

    return { success: true }
  }

  async resetCycle(id: string) {
    const cycle = await prismaClient.tradeCycle.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!cycle) {
      throw new Error('Cycle not found')
    }

    const deleted = await prismaClient.tradeTransaction.deleteMany({
      where: { cycleId: id },
    })

    return {
      success: true,
      deletedTransactions: deleted.count,
    }
  }

  async listTransactions() {
    const rows = await prismaClient.tradeTransaction.findMany({
      include: { cycle: true },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(toPlainTransaction)
  }

  async createTransaction(input: CreateTransactionInput) {
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date()
    const cycleName = input.cycle.trim()
    const cycle = await prismaClient.tradeCycle.upsert({
      where: { name: cycleName },
      create: { name: cycleName },
      update: {},
    })

    if (input.type === 'BUY') {
      const effectiveRateTry =
        input.transactionCurrency === 'TRY'
          ? input.transactionValue / input.amountReceived
          : input.usdTryRateAtBuy
            ? (input.transactionValue * input.usdTryRateAtBuy) / input.amountReceived
            : null

      const commissionPercent =
        input.transactionCurrency === 'USD'
          ? ((input.transactionValue - input.amountReceived) / input.transactionValue) * 100
          : null

      const row = await prismaClient.tradeTransaction.create({
        data: {
          cycleId: cycle.id,
          type: 'BUY',
          occurredAt,
          transactionValue: input.transactionValue,
          transactionCurrency: input.transactionCurrency,
          usdTryRateAtBuy: input.usdTryRateAtBuy,
          amountReceived: input.amountReceived,
          receivedCurrency: 'TRY',
          commissionPercent,
          effectiveRateTry,
        },
        include: { cycle: true },
      })

      return toPlainTransaction(row)
    }

    const amountReceived =
      input.amountReceived ?? (input.pricePerUnit as number | undefined)! * input.amountSold
    const pricePerUnit = input.pricePerUnit ?? amountReceived / input.amountSold

    const row = await prismaClient.tradeTransaction.create({
      data: {
        cycleId: cycle.id,
        type: 'SELL',
        occurredAt,
        amountSold: input.amountSold,
        amountReceived,
        pricePerUnit,
        receivedCurrency: 'TRY',
        effectiveRateTry: pricePerUnit,
      },
      include: { cycle: true },
    })

    return toPlainTransaction(row)
  }
}

export const transactionService = new TransactionService()
