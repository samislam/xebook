import type { TradeTransaction } from './tradebook.types'

export const nowDateTimeLocal = () => {
  const current = new Date()
  const local = new Date(current.getTime() - current.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export const toDateTimeLocal = (value: string) => {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export const toInputNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return ''
  if (!Number.isFinite(value)) return ''
  return String(value)
}

export const truncateToTwoDecimals = (value: number) => Math.trunc(value * 100) / 100

export const formatAmount = (value: number) =>
  truncateToTwoDecimals(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

export const formatUsdt = (value: number) => formatAmount(value)

export const formatTry = (value: number) => formatAmount(value)

export const formatDateOnly = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

export const getNextCycleName = (cycleNames: string[]) => {
  let maxNumber = 0
  for (const name of cycleNames) {
    const match = /^cycle\s+(\d+)$/i.exec(name.trim())
    if (!match) continue
    const parsed = Number.parseInt(match[1], 10)
    if (Number.isFinite(parsed) && parsed > maxNumber) {
      maxNumber = parsed
    }
  }
  return `Cycle ${maxNumber + 1}`
}

export const sortByOccurredAt = (transactions: TradeTransaction[]) =>
  [...transactions].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )

export const calculateRealizedTryProfit = (transactions: TradeTransaction[]) => {
  const ordered = sortByOccurredAt(transactions)
  const tryBuyLots: { remainingUsdt: number; unitCostTry: number }[] = []
  let realizedTryProfit = 0

  for (const transaction of ordered) {
    if (transaction.type === 'BUY') {
      if (transaction.transactionValue && transaction.amountReceived > 0) {
        const unitCostTry =
          transaction.effectiveRateTry ??
          (transaction.transactionCurrency === 'TRY'
            ? transaction.transactionValue / transaction.amountReceived
            : transaction.transactionCurrency === 'USD' && transaction.usdTryRateAtBuy
              ? (transaction.transactionValue * transaction.usdTryRateAtBuy) /
                transaction.amountReceived
              : null)

        if (!unitCostTry) continue

        tryBuyLots.push({
          remainingUsdt: transaction.amountReceived,
          unitCostTry,
        })
      }
      continue
    }

    const soldUsdt = transaction.amountSold ?? 0
    if (soldUsdt <= 0) continue

    const sellRateTry = transaction.pricePerUnit ?? transaction.effectiveRateTry ?? 0
    if (sellRateTry <= 0) continue

    let remainingToMatch = soldUsdt
    let matchedUsdt = 0
    let matchedCostTry = 0

    for (const lot of tryBuyLots) {
      if (remainingToMatch <= 0) break
      if (lot.remainingUsdt <= 0) continue

      const matched = Math.min(lot.remainingUsdt, remainingToMatch)
      lot.remainingUsdt -= matched
      remainingToMatch -= matched
      matchedUsdt += matched
      matchedCostTry += matched * lot.unitCostTry
    }

    if (matchedUsdt > 0) {
      realizedTryProfit += matchedUsdt * sellRateTry - matchedCostTry
    }
  }

  return realizedTryProfit
}
