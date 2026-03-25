import type { CalculateFormValues } from './calculate-form.schema'

export type LoopResult = {
  loop: number
  buyAmount: number
  buyCurrency: 'USD' | 'TRY' | 'SYP'
  buyRateTry: number | null
  sellRateTry: number
  usdtBought: number
  sellTry: number
  profitTry: number
  profitUsd: number
}

export type CalculationResult = {
  mode: 'buy-in-lira' | 'buy-in-dollars'
  localCurrency: 'TRY' | 'SYP'
  loops: LoopResult[]
  startingUsd: number
  finalUsd: number
  totalProfitUsd: number
  finalTry: number
  totalProfitTry: number
}

const toNumber = (value: string) => Number.parseFloat(value)

export const calculateExchangeLoops = (values: CalculateFormValues): CalculationResult => {
  const startingUsd = toNumber(values.startingCapital)
  const sellRate = toNumber(values.sellRate)
  const exchangeRate = toNumber(values.exchangeRate)
  const exchangeTaxPercent = toNumber(values.exchangeTaxPercent)
  const hasExchangeTax = values.exchangeTaxPercent.trim() !== ''
  const buyCommission = toNumber(values.buyCommission)
  const loopCount = Math.max(1, Math.floor(toNumber(values.loopCount)))

  if (!Number.isFinite(startingUsd) || startingUsd <= 0) throw new Error('Invalid starting capital')
  if (!Number.isFinite(sellRate) || sellRate <= 0) throw new Error('Invalid sell rate')
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) throw new Error('Invalid exchange rate')
  if (
    !values.useExchangeRate &&
    hasExchangeTax &&
    (!Number.isFinite(exchangeTaxPercent) || exchangeTaxPercent < 0 || exchangeTaxPercent >= 100)
  ) {
    throw new Error('Invalid exchange tax')
  }
  if (!Number.isFinite(loopCount) || loopCount <= 0) throw new Error('Invalid loop count')

  if (values.useExchangeRate) {
    if (
      values.applyCommission &&
      (!Number.isFinite(buyCommission) || buyCommission < 0 || buyCommission >= 100)
    ) {
      throw new Error('Invalid commission')
    }

    const baseTry = startingUsd * exchangeRate
    let workingTry = baseTry
    let totalProfitTry = 0
    const loops: LoopResult[] = []

    for (let i = 1; i <= loopCount; i += 1) {
      const buyTry = values.compoundProfits ? workingTry : baseTry
      const commissionMultiplier = values.applyCommission ? 1 + buyCommission / 100 : 1
      const effectiveBuyRate = exchangeRate * commissionMultiplier
      const usdtBought = buyTry / effectiveBuyRate
      const sellTryAmount = usdtBought * sellRate
      const profitTry = sellTryAmount - buyTry
      const profitUsd = profitTry / exchangeRate

      totalProfitTry += profitTry
      workingTry = values.compoundProfits ? sellTryAmount : baseTry

      loops.push({
        loop: i,
        buyAmount: buyTry,
        buyCurrency: values.localCurrency,
        buyRateTry: effectiveBuyRate,
        sellRateTry: sellRate,
        usdtBought,
        sellTry: sellTryAmount,
        profitTry,
        profitUsd,
      })
    }

    const finalTry = values.compoundProfits ? workingTry : baseTry + totalProfitTry
    const finalUsd = finalTry / exchangeRate

    return {
      mode: 'buy-in-lira',
      localCurrency: values.localCurrency,
      loops,
      startingUsd,
      finalUsd,
      totalProfitUsd: finalUsd - startingUsd,
      finalTry,
      totalProfitTry,
    }
  }

  if (!Number.isFinite(buyCommission) || buyCommission < 0 || buyCommission >= 100) {
    throw new Error('Invalid commission')
  }

  let workingUsd = startingUsd
  let totalProfitUsd = 0
  const loops: LoopResult[] = []
  const usdConversionRate = exchangeRate * (1 + (hasExchangeTax ? exchangeTaxPercent / 100 : 0))

  for (let i = 1; i <= loopCount; i += 1) {
    const buyUsd = values.compoundProfits ? workingUsd : startingUsd
    const usdtBought = buyUsd * (1 - buyCommission / 100)
    const sellTryAmount = usdtBought * sellRate
    // USD-mode: after selling to TRY, convert TRY back to USD including optional exchange tax.
    const usdAfterCycle = sellTryAmount / usdConversionRate
    const profitUsd = usdAfterCycle - buyUsd

    totalProfitUsd += profitUsd
    workingUsd = values.compoundProfits ? usdAfterCycle : startingUsd

    loops.push({
      loop: i,
      buyAmount: buyUsd,
      buyCurrency: 'USD',
      buyRateTry: usdConversionRate,
      sellRateTry: sellRate,
      usdtBought,
      sellTry: sellTryAmount,
      profitTry: profitUsd * usdConversionRate,
      profitUsd,
    })
  }

  const finalUsd = values.compoundProfits ? workingUsd : startingUsd + totalProfitUsd
  const finalTry = finalUsd * exchangeRate

  return {
    mode: 'buy-in-dollars',
    localCurrency: values.localCurrency,
    loops,
    startingUsd,
    finalUsd,
    totalProfitUsd,
    finalTry,
    totalProfitTry: finalTry - startingUsd * exchangeRate,
  }
}
