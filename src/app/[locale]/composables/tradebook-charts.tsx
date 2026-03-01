'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'CYCLE_SETTLEMENT'
  | 'DEPOSIT_BALANCE_CORRECTION'
  | 'WITHDRAW_BALANCE_CORRECTION'
type TransactionCurrency = 'USD' | 'TRY'

type TradeTransaction = {
  id: string
  type: TransactionType
  occurredAt: string
  transactionValue: number | null
  transactionCurrency: TransactionCurrency | null
  usdTryRateAtBuy: number | null
  amountReceived: number
  amountSold: number | null
  pricePerUnit: number | null
  effectiveRateTry: number | null
}

type TradebookChartsProps = {
  transactions: TradeTransaction[]
}

const formatDateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
  })

const toChartNumber = (value: number) => Number(value.toFixed(2))

const sortByOccurredAt = (transactions: TradeTransaction[]) =>
  [...transactions].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )

const calculateCumulativeTryProfitSeries = (transactions: TradeTransaction[]) => {
  const ordered = sortByOccurredAt(transactions)
  const tryBuyLots: { remainingUsdt: number; unitCostTry: number }[] = []
  const series: { label: string; cumulativeTryProfit: number }[] = []
  let cumulativeTryProfit = 0

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

        if (unitCostTry) {
          tryBuyLots.push({
            remainingUsdt: transaction.amountReceived,
            unitCostTry,
          })
        }
      }
    } else if (transaction.type === 'SELL') {
      const soldUsdt = transaction.amountSold ?? 0
      const sellRateTry = transaction.pricePerUnit ?? transaction.effectiveRateTry ?? 0
      if (soldUsdt > 0 && sellRateTry > 0) {
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
          cumulativeTryProfit += matchedUsdt * sellRateTry - matchedCostTry
        }
      }
    }

    series.push({
      label: formatDateLabel(transaction.occurredAt),
      cumulativeTryProfit: toChartNumber(cumulativeTryProfit),
    })
  }

  return series
}

export const TradebookCharts = ({ transactions }: TradebookChartsProps) => {
  const ordered = useMemo(() => sortByOccurredAt(transactions), [transactions])

  const usdtBalanceSeries = useMemo(() => {
    let balance = 0
    return ordered.map((transaction) => {
      if (transaction.type === 'BUY') {
        balance += transaction.amountReceived
      } else if (transaction.type === 'SELL') {
        balance -= transaction.amountSold ?? 0
      } else {
        balance += transaction.amountReceived - (transaction.amountSold ?? 0)
      }
      return {
        label: formatDateLabel(transaction.occurredAt),
        usdtBalance: toChartNumber(balance),
      }
    })
  }, [ordered])

  const sellRateSeries = useMemo(
    () =>
      ordered
        .filter((transaction) => transaction.type === 'SELL')
        .map((transaction) => ({
          label: formatDateLabel(transaction.occurredAt),
          sellRateTry: toChartNumber(transaction.pricePerUnit ?? transaction.effectiveRateTry ?? 0),
        })),
    [ordered]
  )

  const cumulativeProfitSeries = useMemo(
    () => calculateCumulativeTryProfitSeries(ordered),
    [ordered]
  )

  const hasData = ordered.length > 0

  return (
    <section className="mt-4 space-y-4">
      <h2 className="text-lg font-semibold">Insights</h2>
      {!hasData ? (
        <p className="text-muted-foreground text-sm">Add transactions to see chart insights.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="mb-2 text-sm font-semibold">USDT Balance Trend</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usdtBalanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="usdtBalance"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="mb-2 text-sm font-semibold">Sell Rate (TRY)</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellRateSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sellRateTry" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="mb-2 text-sm font-semibold">Cumulative TRY Profit</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeProfitSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="cumulativeTryProfit"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
