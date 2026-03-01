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
  commissionPercent?: number
}

type SellInput = {
  cycle: string
  type: 'SELL'
  occurredAt?: string
  amountSold: number
  amountReceived?: number
  pricePerUnit?: number
  commissionPercent?: number
}

type CycleSettlementInput = {
  type: 'CYCLE_SETTLEMENT'
  fromCycle: string
  toCycle: string
  occurredAt?: string
  amount: number
}

type DepositBalanceCorrectionInput = {
  cycle: string
  type: 'DEPOSIT_BALANCE_CORRECTION'
  occurredAt?: string
  amount: number
}

type WithdrawBalanceCorrectionInput = {
  cycle: string
  type: 'WITHDRAW_BALANCE_CORRECTION'
  occurredAt?: string
  amount: number
}

type CreateTransactionInput =
  | BuyInput
  | SellInput
  | CycleSettlementInput
  | DepositBalanceCorrectionInput
  | WithdrawBalanceCorrectionInput

const decimalToNumber = (value: Prisma.Decimal | null | undefined) =>
  value === null || value === undefined ? null : Number(value)

const toPlainTransaction = (row: {
  id: string
  cycle: { name: string }
  type:
    | 'BUY'
    | 'SELL'
    | 'CYCLE_SETTLEMENT'
    | 'DEPOSIT_BALANCE_CORRECTION'
    | 'WITHDRAW_BALANCE_CORRECTION'
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
    await prismaClient.$transaction(async (tx) => {
      const cycle = await tx.tradeCycle.findUnique({
        where: { id },
        select: { id: true },
      })

      if (!cycle) {
        throw new Error('Cycle not found')
      }

      await tx.tradeTransaction.deleteMany({
        where: { cycleId: id },
      })

      await tx.tradeCycle.delete({
        where: { id },
      })
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

  async undoLastTransactionInCycle(id: string) {
    const cycle = await prismaClient.tradeCycle.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!cycle) {
      throw new Error('Cycle not found')
    }

    const lastTransaction = await prismaClient.tradeTransaction.findFirst({
      where: { cycleId: id },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    })

    if (!lastTransaction) {
      throw new Error('No transactions found in this cycle')
    }

    await prismaClient.tradeTransaction.delete({
      where: { id: lastTransaction.id },
    })

    return {
      success: true,
      deletedTransactionId: lastTransaction.id,
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
    if (input.type === 'CYCLE_SETTLEMENT') {
      const amount = input.amount
      const fromCycleName = input.fromCycle.trim()
      const toCycleName = input.toCycle.trim()

      if (!fromCycleName || !toCycleName) {
        throw new Error('Both source and destination cycles are required')
      }
      if (fromCycleName === toCycleName) {
        throw new Error('Source and destination cycles must be different')
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Settlement amount must be greater than 0')
      }

      const [fromCycle, toCycle] = await Promise.all([
        prismaClient.tradeCycle.upsert({
          where: { name: fromCycleName },
          create: { name: fromCycleName },
          update: {},
        }),
        prismaClient.tradeCycle.upsert({
          where: { name: toCycleName },
          create: { name: toCycleName },
          update: {},
        }),
      ])

      const sourceRows = await prismaClient.tradeTransaction.findMany({
        where: { cycleId: fromCycle.id },
        select: {
          type: true,
          amountReceived: true,
          amountSold: true,
        },
      })

      const sourceBalance = sourceRows.reduce((sum, row) => {
        if (row.type === 'BUY') return sum + Number(row.amountReceived)
        if (row.type === 'SELL') return sum - Number(row.amountSold ?? 0)
        return sum + Number(row.amountReceived) - Number(row.amountSold ?? 0)
      }, 0)

      if (amount > sourceBalance + Number.EPSILON) {
        throw new Error(
          `Settlement amount (${amount.toFixed(4)}) exceeds source cycle balance (${sourceBalance.toFixed(4)})`
        )
      }

      const [fromRow, toRow] = await prismaClient.$transaction([
        prismaClient.tradeTransaction.create({
          data: {
            cycleId: fromCycle.id,
            type: 'CYCLE_SETTLEMENT',
            occurredAt,
            amountReceived: 0,
            amountSold: amount,
            receivedCurrency: 'TRY',
          },
          include: { cycle: true },
        }),
        prismaClient.tradeTransaction.create({
          data: {
            cycleId: toCycle.id,
            type: 'CYCLE_SETTLEMENT',
            occurredAt,
            amountReceived: amount,
            amountSold: null,
            receivedCurrency: 'TRY',
          },
          include: { cycle: true },
        }),
      ])

      return [toPlainTransaction(fromRow), toPlainTransaction(toRow)]
    }

    if (
      input.type === 'DEPOSIT_BALANCE_CORRECTION' ||
      input.type === 'WITHDRAW_BALANCE_CORRECTION'
    ) {
      const amount = input.amount
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Correction amount must be greater than 0')
      }

      const cycleName = input.cycle.trim()
      const cycle = await prismaClient.tradeCycle.upsert({
        where: { name: cycleName },
        create: { name: cycleName },
        update: {},
      })

      if (input.type === 'WITHDRAW_BALANCE_CORRECTION') {
        const cycleRows = await prismaClient.tradeTransaction.findMany({
          where: { cycleId: cycle.id },
          select: {
            type: true,
            amountReceived: true,
            amountSold: true,
          },
        })

        const cycleBalance = cycleRows.reduce((sum, row) => {
          if (row.type === 'BUY') return sum + Number(row.amountReceived)
          if (row.type === 'SELL') return sum - Number(row.amountSold ?? 0)
          return sum + Number(row.amountReceived) - Number(row.amountSold ?? 0)
        }, 0)

        if (amount > cycleBalance + Number.EPSILON) {
          throw new Error(
            `Withdraw correction amount (${amount.toFixed(4)}) exceeds cycle balance (${cycleBalance.toFixed(4)})`
          )
        }
      }

      const row = await prismaClient.tradeTransaction.create({
        data: {
          cycleId: cycle.id,
          type: input.type,
          occurredAt,
          amountReceived: input.type === 'DEPOSIT_BALANCE_CORRECTION' ? amount : 0,
          amountSold: input.type === 'WITHDRAW_BALANCE_CORRECTION' ? amount : null,
          receivedCurrency: 'TRY',
        },
        include: { cycle: true },
      })

      return toPlainTransaction(row)
    }

    const cycleName = input.cycle.trim()
    const cycle = await prismaClient.tradeCycle.upsert({
      where: { name: cycleName },
      create: { name: cycleName },
      update: {},
    })

    if (input.type === 'BUY') {
      const commissionPercent =
        input.commissionPercent !== undefined
          ? input.commissionPercent
          : input.transactionCurrency === 'USD'
            ? ((input.transactionValue - input.amountReceived) / input.transactionValue) * 100
            : null
      const commissionRatio = commissionPercent !== null ? commissionPercent / 100 : 0
      const grossBoughtUsdt =
        commissionRatio > 0 && commissionRatio < 1
          ? input.amountReceived / (1 - commissionRatio)
          : input.amountReceived

      const effectiveRateTry =
        input.transactionCurrency === 'TRY'
          ? input.transactionValue / grossBoughtUsdt
          : input.usdTryRateAtBuy
            ? (input.transactionValue * input.usdTryRateAtBuy) / grossBoughtUsdt
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

    const commissionRatio = (input.commissionPercent ?? 0) / 100
    const netSoldUsdt = input.amountSold * (1 - commissionRatio)

    const amountReceived =
      input.amountReceived ?? (input.pricePerUnit as number | undefined)! * netSoldUsdt
    const pricePerUnit = input.pricePerUnit ?? amountReceived / netSoldUsdt

    const row = await prismaClient.tradeTransaction.create({
      data: {
        cycleId: cycle.id,
        type: 'SELL',
        occurredAt,
        amountSold: input.amountSold,
        amountReceived,
        pricePerUnit,
        receivedCurrency: 'TRY',
        commissionPercent: input.commissionPercent,
        effectiveRateTry: pricePerUnit,
      },
      include: { cycle: true },
    })

    return toPlainTransaction(row)
  }
}

export const transactionService = new TransactionService()
