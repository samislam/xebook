import { Prisma } from '@/generated/prisma'
import { AppError } from '../../classes/app-error.class'
import { prismaClient } from '@/lib/prisma/prisma-client'
import { DUPLICATE_ENTRY, NOT_FOUND, VALIDATION_ERR } from '@/constants'
import type { PriceCalculatorValues } from '@/app/[locale]/(routing)/(protected)/price-calculator/price-calculator.schema'

const assertScenarioName = (name: string) => {
  const normalized = name.trim()
  if (!normalized) {
    throw new AppError(VALIDATION_ERR, 'Scenario name is required')
  }

  return normalized
}

const toPlainScenario = (scenario: {
  id: string
  name: string
  values: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}) => ({
  id: scenario.id,
  name: scenario.name,
  values: scenario.values as PriceCalculatorValues,
  createdAt: scenario.createdAt.toISOString(),
  updatedAt: scenario.updatedAt.toISOString(),
})

export class PriceCalculatorScenariosService {
  async list(userId: string) {
    const scenarios = await prismaClient.priceCalculatorScenario.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      createdAt: scenario.createdAt.toISOString(),
      updatedAt: scenario.updatedAt.toISOString(),
    }))
  }

  async get(userId: string, id: string) {
    const scenario = await prismaClient.priceCalculatorScenario.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!scenario) {
      throw new AppError(NOT_FOUND, 'Scenario not found')
    }

    return toPlainScenario(scenario)
  }

  async create(userId: string, name: string, values: PriceCalculatorValues) {
    const normalizedName = assertScenarioName(name)

    const existing = await prismaClient.priceCalculatorScenario.findFirst({
      where: {
        userId,
        name: normalizedName,
      },
      select: { id: true },
    })

    if (existing) {
      throw new AppError(DUPLICATE_ENTRY, 'A scenario with this name already exists')
    }

    const scenario = await prismaClient.priceCalculatorScenario.create({
      data: {
        userId,
        name: normalizedName,
        values,
      },
    })

    return toPlainScenario(scenario)
  }

  async update(userId: string, id: string, name: string, values: PriceCalculatorValues) {
    const normalizedName = assertScenarioName(name)

    const scenarioToUpdate = await prismaClient.priceCalculatorScenario.findFirst({
      where: {
        id,
        userId,
      },
      select: { id: true },
    })

    if (!scenarioToUpdate) {
      throw new AppError(NOT_FOUND, 'Scenario not found')
    }

    const existing = await prismaClient.priceCalculatorScenario.findFirst({
      where: {
        userId,
        id: { not: id },
        name: normalizedName,
      },
      select: { id: true },
    })

    if (existing) {
      throw new AppError(DUPLICATE_ENTRY, 'A scenario with this name already exists')
    }

    try {
      const scenario = await prismaClient.priceCalculatorScenario.update({
        where: { id },
        data: {
          name: normalizedName,
          values,
        },
      })

      return toPlainScenario(scenario)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError(NOT_FOUND, 'Scenario not found')
      }

      throw error
    }
  }

  async delete(userId: string, id: string) {
    const scenario = await prismaClient.priceCalculatorScenario.findFirst({
      where: {
        id,
        userId,
      },
      select: { id: true },
    })

    if (!scenario) {
      throw new AppError(NOT_FOUND, 'Scenario not found')
    }

    await prismaClient.priceCalculatorScenario.delete({
      where: { id },
    })

    return {
      success: true as const,
      deletedScenarioId: id,
    }
  }
}

export const priceCalculatorScenariosService = new PriceCalculatorScenariosService()
