import { Prisma } from '@/generated/prisma'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { nanoid } from 'nanoid'
import { prismaClient } from '@/lib/prisma/prisma-client'
import appConfig from '@/config/app.config'

type BuyInput = {
  cycle: string
  type: 'BUY'
  transactionValue: number
  transactionCurrency: 'USD' | 'TRY'
  usdTryRateAtBuy?: number
  occurredAt?: string
  amountReceived: number
  commissionPercent?: number
  payingWithCash?: boolean
  senderInstitution?: string
  senderIban?: string
  senderName?: string
  recipientInstitution?: string
  recipientIban?: string
  recipientName?: string
}

type SellInput = {
  cycle: string
  type: 'SELL'
  occurredAt?: string
  amountSold: number
  amountReceived?: number
  pricePerUnit?: number
  commissionPercent?: number
  payingWithCash?: boolean
  senderInstitution?: string
  senderIban?: string
  senderName?: string
  recipientInstitution?: string
  recipientIban?: string
  recipientName?: string
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
type UpdateTransactionInput = Exclude<CreateTransactionInput, CycleSettlementInput>

const decimalToNumber = (value: Prisma.Decimal | null | undefined) =>
  value === null || value === undefined ? null : Number(value)

const applyUsdtDelta = (
  sum: number,
  row: { type: string; amountReceived: Prisma.Decimal; amountSold: Prisma.Decimal | null }
) => {
  if (row.type === 'BUY') return sum + Number(row.amountReceived)
  if (row.type === 'SELL') return sum - Number(row.amountSold ?? 0)
  return sum + Number(row.amountReceived) - Number(row.amountSold ?? 0)
}

const normalizeOptionalText = (value: string | undefined) => {
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

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
  payingWithCash: boolean
  senderInstitution: string | null
  senderIban: string | null
  senderName: string | null
  recipientInstitutionRef: { name: string } | null
  recipientIban: string | null
  recipientName: string | null
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
  payingWithCash: row.payingWithCash,
  senderInstitution: row.senderInstitution,
  senderIban: row.senderIban,
  senderName: row.senderName,
  recipientInstitution: row.recipientInstitutionRef?.name ?? null,
  recipientIban: row.recipientIban,
  recipientName: row.recipientName,
})

export class TransactionService {
  async getInstitutionIcon(fileName: string) {
    const safeFileName = path.basename(fileName)
    if (!safeFileName || safeFileName !== fileName) {
      throw new Error('Invalid icon file name')
    }

    const absolutePath = path.join(appConfig.uploadDir, safeFileName)
    const buffer = await readFile(absolutePath)
    const extension = path.extname(safeFileName).toLowerCase()
    const contentType =
      extension === '.png'
        ? 'image/png'
        : extension === '.jpg' || extension === '.jpeg'
          ? 'image/jpeg'
          : extension === '.webp'
            ? 'image/webp'
            : extension === '.gif'
              ? 'image/gif'
              : extension === '.svg'
                ? 'image/svg+xml'
                : 'application/octet-stream'

    return { buffer, contentType }
  }

  private async saveInstitutionIconFile(icon: File) {
    if (!icon.type.startsWith('image/')) {
      throw new Error('Institution icon must be an image')
    }

    const ext = path.extname(icon.name || '').toLowerCase() || '.bin'
    const fileName = `${nanoid()}${ext}`
    const absolutePath = path.join(appConfig.uploadDir, fileName)
    const bytes = await icon.arrayBuffer()

    await mkdir(appConfig.uploadDir, { recursive: true })
    await writeFile(absolutePath, Buffer.from(bytes))

    return fileName
  }

  private async resolveInstitutionId(name: string | undefined) {
    const normalized = normalizeOptionalText(name)
    if (!normalized) return null
    const institution = await prismaClient.institution.upsert({
      where: { name: normalized },
      create: { name: normalized },
      update: {},
      select: { id: true },
    })
    return institution.id
  }

  async listInstitutions() {
    const institutions = await prismaClient.institution.findMany({
      orderBy: { name: 'asc' },
    })

    return institutions.map((institution) => ({
      id: institution.id,
      name: institution.name,
      iconFileName: institution.iconFileName,
      createdAt: institution.createdAt.toISOString(),
      updatedAt: institution.updatedAt.toISOString(),
    }))
  }

  async createInstitution(name: string, icon?: File) {
    const normalizedName = name.trim()
    if (!normalizedName) {
      throw new Error('Institution name is required')
    }

    const iconFileName = icon ? await this.saveInstitutionIconFile(icon) : undefined

    const institution = await prismaClient.institution.upsert({
      where: { name: normalizedName },
      create: {
        name: normalizedName,
        iconFileName,
      },
      update: iconFileName ? { iconFileName } : {},
    })

    return {
      id: institution.id,
      name: institution.name,
      iconFileName: institution.iconFileName,
      createdAt: institution.createdAt.toISOString(),
      updatedAt: institution.updatedAt.toISOString(),
    }
  }

  private async getCycleUsdtBalance(cycleId: string, excludeTransactionId?: string) {
    const cycleRows = await prismaClient.tradeTransaction.findMany({
      where: {
        cycleId,
        ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
      },
      select: {
        type: true,
        amountReceived: true,
        amountSold: true,
      },
    })

    return cycleRows.reduce(applyUsdtDelta, 0)
  }

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
      include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(toPlainTransaction)
  }

  async deleteTransaction(id: string) {
    const deleted = await prismaClient.tradeTransaction.delete({
      where: { id },
      select: { id: true },
    })

    return {
      success: true,
      deletedTransactionId: deleted.id,
    }
  }

  async updateTransaction(id: string, input: UpdateTransactionInput) {
    const existing = await prismaClient.tradeTransaction.findUnique({
      where: { id },
      include: { cycle: true },
    })
    if (!existing) {
      throw new Error('Transaction not found')
    }

    if (existing.type === 'CYCLE_SETTLEMENT') {
      throw new Error('Cycle settlement transactions are not editable')
    }

    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : existing.occurredAt

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
        const cycleBalance = await this.getCycleUsdtBalance(cycle.id, id)
        if (amount > cycleBalance + Number.EPSILON) {
          throw new Error(
            `Withdraw correction amount (${amount.toFixed(4)}) exceeds cycle balance (${cycleBalance.toFixed(4)})`
          )
        }
      }

      const row = await prismaClient.tradeTransaction.update({
        where: { id },
        data: {
          cycleId: cycle.id,
          type: input.type,
          occurredAt,
          transactionValue: null,
          transactionCurrency: null,
          usdTryRateAtBuy: null,
          amountReceived: input.type === 'DEPOSIT_BALANCE_CORRECTION' ? amount : 0,
          amountSold: input.type === 'WITHDRAW_BALANCE_CORRECTION' ? amount : null,
          pricePerUnit: null,
          receivedCurrency: 'TRY',
          commissionPercent: null,
          effectiveRateTry: null,
          payingWithCash: false,
          senderInstitution: null,
          senderIban: null,
          senderName: null,
          recipientInstitutionId: null,
          recipientIban: null,
          recipientName: null,
        },
        include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
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
      const payingWithCash = input.payingWithCash ?? false
      const recipientInstitutionId = payingWithCash
        ? null
        : await this.resolveInstitutionId(input.recipientInstitution)
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

      const row = await prismaClient.tradeTransaction.update({
        where: { id },
        data: {
          cycleId: cycle.id,
          type: 'BUY',
          occurredAt,
          transactionValue: input.transactionValue,
          transactionCurrency: input.transactionCurrency,
          usdTryRateAtBuy: input.usdTryRateAtBuy,
          amountReceived: input.amountReceived,
          amountSold: null,
          pricePerUnit: null,
          receivedCurrency: 'TRY',
          commissionPercent,
          effectiveRateTry,
          payingWithCash,
          senderInstitution: payingWithCash ? null : normalizeOptionalText(input.senderInstitution),
          senderIban: payingWithCash ? null : normalizeOptionalText(input.senderIban),
          senderName: payingWithCash ? null : normalizeOptionalText(input.senderName),
          recipientInstitutionId,
          recipientIban: payingWithCash ? null : normalizeOptionalText(input.recipientIban),
          recipientName: payingWithCash ? null : normalizeOptionalText(input.recipientName),
        },
        include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
      })

      return toPlainTransaction(row)
    }

    const commissionRatio = (input.commissionPercent ?? 0) / 100
    const netSoldUsdt = input.amountSold * (1 - commissionRatio)

    const amountReceived =
      input.amountReceived ?? (input.pricePerUnit as number | undefined)! * netSoldUsdt
    const pricePerUnit = input.pricePerUnit ?? amountReceived / netSoldUsdt

    const payingWithCash = input.payingWithCash ?? false
    const recipientInstitutionId = payingWithCash
      ? null
      : await this.resolveInstitutionId(input.recipientInstitution)
    const row = await prismaClient.tradeTransaction.update({
      where: { id },
      data: {
        cycleId: cycle.id,
        type: 'SELL',
        occurredAt,
        transactionValue: null,
        transactionCurrency: null,
        usdTryRateAtBuy: null,
        amountReceived,
        amountSold: input.amountSold,
        pricePerUnit,
        receivedCurrency: 'TRY',
        commissionPercent: input.commissionPercent,
        effectiveRateTry: pricePerUnit,
        payingWithCash,
        senderInstitution: payingWithCash ? null : normalizeOptionalText(input.senderInstitution),
        senderIban: payingWithCash ? null : normalizeOptionalText(input.senderIban),
        senderName: payingWithCash ? null : normalizeOptionalText(input.senderName),
        recipientInstitutionId,
        recipientIban: payingWithCash ? null : normalizeOptionalText(input.recipientIban),
        recipientName: payingWithCash ? null : normalizeOptionalText(input.recipientName),
      },
      include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
    })

    return toPlainTransaction(row)
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

      const sourceBalance = sourceRows.reduce(applyUsdtDelta, 0)

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
            payingWithCash: false,
          },
          include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
        }),
        prismaClient.tradeTransaction.create({
          data: {
            cycleId: toCycle.id,
            type: 'CYCLE_SETTLEMENT',
            occurredAt,
            amountReceived: amount,
            amountSold: null,
            receivedCurrency: 'TRY',
            payingWithCash: false,
          },
          include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
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

        const cycleBalance = cycleRows.reduce(applyUsdtDelta, 0)

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
          payingWithCash: false,
          senderInstitution: null,
          senderIban: null,
          senderName: null,
          recipientInstitutionId: null,
          recipientIban: null,
          recipientName: null,
        },
        include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
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
      const payingWithCash = input.payingWithCash ?? false
      const recipientInstitutionId = payingWithCash
        ? null
        : await this.resolveInstitutionId(input.recipientInstitution)
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
          payingWithCash,
          senderInstitution: payingWithCash ? null : normalizeOptionalText(input.senderInstitution),
          senderIban: payingWithCash ? null : normalizeOptionalText(input.senderIban),
          senderName: payingWithCash ? null : normalizeOptionalText(input.senderName),
          recipientInstitutionId,
          recipientIban: payingWithCash ? null : normalizeOptionalText(input.recipientIban),
          recipientName: payingWithCash ? null : normalizeOptionalText(input.recipientName),
        },
        include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
      })

      return toPlainTransaction(row)
    }

    const commissionRatio = (input.commissionPercent ?? 0) / 100
    const netSoldUsdt = input.amountSold * (1 - commissionRatio)

    const amountReceived =
      input.amountReceived ?? (input.pricePerUnit as number | undefined)! * netSoldUsdt
    const pricePerUnit = input.pricePerUnit ?? amountReceived / netSoldUsdt

    const payingWithCash = input.payingWithCash ?? false
    const recipientInstitutionId = payingWithCash
      ? null
      : await this.resolveInstitutionId(input.recipientInstitution)
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
        payingWithCash,
        senderInstitution: payingWithCash ? null : normalizeOptionalText(input.senderInstitution),
        senderIban: payingWithCash ? null : normalizeOptionalText(input.senderIban),
        senderName: payingWithCash ? null : normalizeOptionalText(input.senderName),
        recipientInstitutionId,
        recipientIban: payingWithCash ? null : normalizeOptionalText(input.recipientIban),
        recipientName: payingWithCash ? null : normalizeOptionalText(input.recipientName),
      },
      include: { cycle: true, recipientInstitutionRef: { select: { name: true } } },
    })

    return toPlainTransaction(row)
  }
}

export const transactionService = new TransactionService()
