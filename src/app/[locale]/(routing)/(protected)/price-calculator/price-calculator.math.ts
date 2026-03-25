import type {
  CostVector,
  Currency,
  PriceCalculatorSummary,
  Rates,
  ScenarioStep,
  StepPreview,
} from './price-calculator.types'
import type { PriceCalculatorValues } from './price-calculator.schema'

type Lot = {
  amount: number
  cost: CostVector
}

const ZERO_COST: CostVector = {
  SYP: 0,
  TRY: 0,
  USD: 0,
}

const parseNumber = (value: string | undefined) => {
  if (!value?.trim()) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const addCost = (left: CostVector, right: CostVector): CostVector => ({
  SYP: left.SYP + right.SYP,
  TRY: left.TRY + right.TRY,
  USD: left.USD + right.USD,
})

const scaleCost = (vector: CostVector, ratio: number): CostVector => ({
  SYP: vector.SYP * ratio,
  TRY: vector.TRY * ratio,
  USD: vector.USD * ratio,
})

const createNativeCost = (currency: Currency, amount: number): CostVector => {
  if (currency === 'USDT') return ZERO_COST

  return {
    SYP: currency === 'SYP' ? amount : 0,
    TRY: currency === 'TRY' ? amount : 0,
    USD: currency === 'USD' ? amount : 0,
  }
}

const convertCostVector = (
  cost: CostVector,
  targetCurrency: Exclude<Currency, 'USDT'>,
  rates: Rates
) => {
  let total = 0

  if (targetCurrency === 'USD') {
    total += cost.USD
    if (cost.SYP !== 0) {
      if (!rates.usdToSyp) return null
      total += cost.SYP / rates.usdToSyp
    }

    if (cost.TRY !== 0) {
      if (!rates.usdToTry) return null
      total += cost.TRY / rates.usdToTry
    }
  }

  if (targetCurrency === 'SYP') {
    total += cost.SYP
    if (cost.USD !== 0) {
      if (!rates.usdToSyp) return null
      total += cost.USD * rates.usdToSyp
    }

    if (cost.TRY !== 0) {
      if (!rates.usdToTry || !rates.usdToSyp) return null
      total += (cost.TRY / rates.usdToTry) * rates.usdToSyp
    }
  }

  if (targetCurrency === 'TRY') {
    total += cost.TRY
    if (cost.USD !== 0) {
      if (!rates.usdToTry) return null
      total += cost.USD * rates.usdToTry
    }

    if (cost.SYP !== 0) {
      if (!rates.usdToSyp || !rates.usdToTry) return null
      total += (cost.SYP / rates.usdToSyp) * rates.usdToTry
    }
  }

  return Number.isFinite(total) ? total : null
}

const sumLots = (lots: Lot[]) =>
  lots.reduce(
    (acc, lot) => ({
      amount: acc.amount + lot.amount,
      cost: addCost(acc.cost, lot.cost),
    }),
    { amount: 0, cost: ZERO_COST }
  )

const createInventory = (): Record<Currency, Lot[]> => ({
  SYP: [],
  TRY: [],
  USD: [],
  USDT: [],
})

const addNativeLot = (inventory: Record<Currency, Lot[]>, currency: Currency, amount: number) => {
  if (amount <= 0) return
  inventory[currency].push({
    amount,
    cost: createNativeCost(currency, amount),
  })
}

const consumeLots = (
  inventory: Record<Currency, Lot[]>,
  currency: Currency,
  amount: number,
  warnings: string[]
) => {
  if (amount <= 0) return ZERO_COST

  if (currency !== 'USDT' && inventory[currency].length === 0) {
    return createNativeCost(currency, amount)
  }

  let remaining = amount
  let consumed = ZERO_COST

  while (remaining > 0 && inventory[currency].length > 0) {
    const lot = inventory[currency][0]
    const take = Math.min(lot.amount, remaining)
    const ratio = take / lot.amount
    consumed = addCost(consumed, scaleCost(lot.cost, ratio))
    lot.amount -= take
    lot.cost = scaleCost(lot.cost, 1 - ratio)
    remaining -= take

    if (lot.amount <= 0.0000001) {
      inventory[currency].shift()
    }
  }

  if (remaining > 0) {
    if (currency === 'USDT') {
      warnings.push(
        `Sold or consumed ${remaining.toFixed(4)} USDT without enough scenario inventory.`
      )
    } else {
      consumed = addCost(consumed, createNativeCost(currency, remaining))
    }
  }

  return consumed
}

const getStepPreview = (
  step: ScenarioStep,
  sourceSpent: number,
  outputAmount: number | null
): StepPreview => ({
  label: step.label || (step.type === 'EXPENSE' ? 'Expense' : 'Conversion'),
  description:
    step.type === 'EXPENSE'
      ? `${step.fromCurrency} expense`
      : `${step.fromCurrency} -> ${step.toCurrency}`,
  netSourceAmount: sourceSpent,
  outputAmount,
})

export const calculatePriceCalculatorSummary = (
  values: PriceCalculatorValues
): PriceCalculatorSummary => {
  const inventory = createInventory()
  const warnings: string[] = []
  const previews: StepPreview[] = []
  let includedExpenses = ZERO_COST

  const rates: Rates = {
    usdToSyp: parseNumber(values.usdToSypRate),
    usdToTry: parseNumber(values.usdToTryRate),
  }

  for (const step of values.steps) {
    const fromAmount = parseNumber(step.fromAmount) ?? 0
    const toAmount = parseNumber(step.toAmount)
    const fixedFee = parseNumber(step.fixedFee) ?? 0
    const percentFee = parseNumber(step.percentFee) ?? 0
    const feeOnSource = fromAmount * (percentFee / 100)
    const totalSourceSpent = fromAmount + fixedFee + feeOnSource

    if (step.type === 'EXPENSE') {
      const expenseFeeOnly = fixedFee + feeOnSource

      if (expenseFeeOnly > 0 && step.includeInUsdtCostBasis) {
        includedExpenses = addCost(
          includedExpenses,
          createNativeCost(step.fromCurrency, expenseFeeOnly)
        )
      }

      previews.push(getStepPreview(step, totalSourceSpent, null))
      continue
    }

    if (!toAmount || toAmount <= 0 || totalSourceSpent <= 0) {
      previews.push(getStepPreview(step, totalSourceSpent, toAmount ?? null))
      continue
    }

    const consumedCost = consumeLots(inventory, step.fromCurrency, totalSourceSpent, warnings)
    inventory[step.toCurrency].push({
      amount: toAmount,
      cost: consumedCost,
    })

    previews.push(getStepPreview(step, totalSourceSpent, toAmount))
  }

  const holdings = {
    SYP: sumLots(inventory.SYP).amount,
    TRY: sumLots(inventory.TRY).amount,
    USD: sumLots(inventory.USD).amount,
    USDT: sumLots(inventory.USDT).amount,
  }

  const usdtLots = sumLots(inventory.USDT)
  const usdtCostVector = addCost(usdtLots.cost, includedExpenses)
  const usdtHoldings = usdtLots.amount

  const effectivePricePerUsdt = {
    USD:
      usdtHoldings > 0
        ? (() => {
            const value = convertCostVector(usdtCostVector, 'USD', rates)
            return value !== null ? value / usdtHoldings : null
          })()
        : null,
    SYP:
      usdtHoldings > 0
        ? (() => {
            const value = convertCostVector(usdtCostVector, 'SYP', rates)
            return value !== null ? value / usdtHoldings : null
          })()
        : null,
    TRY:
      usdtHoldings > 0
        ? (() => {
            const value = convertCostVector(usdtCostVector, 'TRY', rates)
            return value !== null ? value / usdtHoldings : null
          })()
        : null,
  }

  const usdBridgeConversions = values.steps.filter(
    (step) =>
      step.type === 'CONVERSION' &&
      step.fromCurrency === 'USD' &&
      step.toCurrency === 'USDT' &&
      (parseNumber(step.toAmount) ?? 0) > 0
  )

  const totalUsdIntoUsdt = usdBridgeConversions.reduce(
    (sum, step) => sum + (parseNumber(step.fromAmount) ?? 0),
    0
  )
  const totalUsdtFromUsd = usdBridgeConversions.reduce(
    (sum, step) => sum + (parseNumber(step.toAmount) ?? 0),
    0
  )

  const weightedUsdBridgeRate =
    totalUsdIntoUsdt > 0 && totalUsdtFromUsd > 0 ? totalUsdIntoUsdt / totalUsdtFromUsd : null

  const targetSellCurrency = values.targetSellCurrency
  const targetExitMode = values.targetExitMode
  const targetUsdtAmountInput = parseNumber(values.targetUsdtAmount)
  const targetProfitPercent = parseNumber(values.targetProfitPercent)
  const targetSellPricePerUsdt = parseNumber(values.targetSellPricePerUsdt)
  const targetSellFeePercent = parseNumber(values.targetSellFeePercent) ?? 0
  const targetSellFeeFixed = parseNumber(values.targetSellFeeFixed) ?? 0
  const targetUsdtAmount = targetUsdtAmountInput ?? usdtHoldings

  const costPerUsdtInSellCurrency =
    targetSellCurrency === 'USDT'
      ? 1
      : targetSellCurrency === 'USD'
        ? effectivePricePerUsdt.USD
        : targetSellCurrency === 'SYP'
          ? effectivePricePerUsdt.SYP
          : effectivePricePerUsdt.TRY

  let netPricePerUsdt: number | null = null
  let grossPricePerUsdt: number | null = null
  let netTotal: number | null = null
  let grossTotal: number | null = null
  let targetProfitAmount: number | null = null
  let premiumPercent: number | null = null
  let previousCapital: number | null = null
  let newCapital: number | null = null

  if (targetUsdtAmount > 0 && costPerUsdtInSellCurrency !== null) {
    const costTotal = costPerUsdtInSellCurrency * targetUsdtAmount
    previousCapital = costTotal

    if (targetExitMode === 'PRICE' && targetSellPricePerUsdt !== null) {
      netPricePerUsdt = targetSellPricePerUsdt
      netTotal = netPricePerUsdt * targetUsdtAmount
      newCapital = netTotal
      targetProfitAmount = netTotal - costTotal
      const denominator = costTotal === 0 ? null : costTotal
      const computedProfitPercent =
        denominator !== null ? (targetProfitAmount / denominator) * 100 : null

      const retention = 1 - targetSellFeePercent / 100
      if (retention > 0) {
        grossTotal = (netTotal + targetSellFeeFixed) / retention
        grossPricePerUsdt = grossTotal / targetUsdtAmount
      }

      if (targetSellCurrency === 'USD' && netPricePerUsdt !== null) {
        premiumPercent = (netPricePerUsdt - 1) * 100
      } else if (
        targetSellCurrency !== 'USDT' &&
        netPricePerUsdt !== null &&
        effectivePricePerUsdt.USD !== null
      ) {
        const usdEquivalent =
          targetSellCurrency === 'SYP'
            ? rates.usdToSyp
              ? netPricePerUsdt / rates.usdToSyp
              : null
            : targetSellCurrency === 'TRY'
              ? rates.usdToTry
                ? netPricePerUsdt / rates.usdToTry
                : null
              : netPricePerUsdt

        premiumPercent = usdEquivalent !== null ? (usdEquivalent - 1) * 100 : null
      }

      return {
        currentHoldings: holdings,
        usdtHoldings,
        includedExpenseVector: includedExpenses,
        usdtCostVector,
        effectivePricePerUsdt,
        weightedUsdBridgeRate,
        targetSell: {
          currency: targetSellCurrency,
          exitMode: targetExitMode,
          usdtAmount: targetUsdtAmount,
          profitPercent: computedProfitPercent,
          previousCapital,
          newCapital,
          netPricePerUsdt,
          grossPricePerUsdt,
          netTotal,
          grossTotal,
          targetProfitAmount,
          premiumPercent,
        },
        previews,
        warnings,
      }
    }

    if (targetExitMode === 'PERCENT' && targetProfitPercent !== null) {
      netTotal = costTotal * (1 + targetProfitPercent / 100)
      newCapital = netTotal
      netPricePerUsdt = netTotal / targetUsdtAmount

      const retention = 1 - targetSellFeePercent / 100
      if (retention > 0) {
        grossTotal = (netTotal + targetSellFeeFixed) / retention
        grossPricePerUsdt = grossTotal / targetUsdtAmount
        targetProfitAmount = netTotal - costTotal
      }

      if (targetSellCurrency === 'USD' && netPricePerUsdt !== null) {
        premiumPercent = (netPricePerUsdt - 1) * 100
      } else if (
        targetSellCurrency !== 'USDT' &&
        netPricePerUsdt !== null &&
        effectivePricePerUsdt.USD !== null
      ) {
        const usdEquivalent =
          targetSellCurrency === 'SYP'
            ? rates.usdToSyp
              ? netPricePerUsdt / rates.usdToSyp
              : null
            : targetSellCurrency === 'TRY'
              ? rates.usdToTry
                ? netPricePerUsdt / rates.usdToTry
                : null
              : netPricePerUsdt

        premiumPercent = usdEquivalent !== null ? (usdEquivalent - 1) * 100 : null
      }
    }
  }

  return {
    currentHoldings: holdings,
    usdtHoldings,
    includedExpenseVector: includedExpenses,
    usdtCostVector,
    effectivePricePerUsdt,
    weightedUsdBridgeRate,
    targetSell: {
      currency: targetSellCurrency,
      exitMode: targetExitMode,
      usdtAmount: targetUsdtAmount,
      profitPercent: targetProfitPercent,
      previousCapital,
      newCapital,
      netPricePerUsdt,
      grossPricePerUsdt,
      netTotal,
      grossTotal,
      targetProfitAmount,
      premiumPercent,
    },
    previews,
    warnings,
  }
}
