import Image from 'next/image'
import numeral from 'numeral'
import { TrendingUpDown } from 'lucide-react'
import usdtIcon from '@/media/usdt.svg'
import { type LoopResult } from './calculate'

type TradesTableProps = {
  data: LoopResult[]
  initialRows?: number
  localCurrency?: 'TRY' | 'SYP'
}

const formatUsd = (value: number) => numeral(value).format('0,0.00')
const formatLocal = (value: number) => numeral(value).format('0,0')
const formatUsdt = (value: number) => numeral(value).format('0,0.00')
const formatRate = (value: number) => numeral(value).format('0,0')
const currencySymbol: Record<'USD' | 'TRY' | 'SYP', string> = {
  USD: '$',
  TRY: '₺',
  SYP: '£',
}
const formatLocalSigned = (value: number, localCurrency: 'TRY' | 'SYP') =>
  `${value >= 0 ? '+' : '-'}${currencySymbol[localCurrency]}${formatLocal(Math.abs(value))}`
const formatUsdSigned = (value: number) =>
  `${value >= 0 ? '+$' : '-$'}${formatUsd(Math.abs(value))}`
const formatPctSigned = (value: number) =>
  `${value >= 0 ? '+' : '-'}${numeral(Math.abs(value)).format('0,0.00')}%`

export const TradesTable = ({ data, initialRows = 0, localCurrency = 'TRY' }: TradesTableProps) => {
  const totals = data.reduce(
    (acc, loop) => {
      acc.buy += loop.buyAmount
      acc.usdt += loop.usdtBought
      acc.sellTry += loop.sellTry
      acc.profitTry += loop.profitTry
      acc.profitUsd += loop.profitUsd
      return acc
    },
    { buy: 0, usdt: 0, sellTry: 0, profitTry: 0, profitUsd: 0 }
  )
  const firstLoop = data[0]
  const buyCurrency = firstLoop?.buyCurrency
  const buyRateTry = firstLoop?.buyRateTry ?? null
  const sellRateTry = firstLoop?.sellRateTry ?? null
  const emptyRowsCount = Math.max(0, initialRows - data.length)
  const localCurrencySymbol = currencySymbol[localCurrency]

  return (
    <div className="border-border max-h-130 overflow-auto rounded-md border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th
              className="border-border sticky top-0 z-30 border-r bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]"
              rowSpan={2}
            >
              No.
            </th>
            <th
              className="sticky top-0 z-30 bg-red-100 px-3 py-2 text-center text-red-700 dark:bg-red-900/30 dark:text-red-300"
              colSpan={2}
            >
              BUY
            </th>
            <th
              className="border-border sticky top-0 z-30 border-l bg-emerald-100 px-3 py-2 text-center text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              colSpan={3}
            >
              SELL
            </th>
          </tr>
          <tr>
            <th className="sticky top-8 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]">
              Buy
            </th>
            <th className="sticky top-8 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]">
              USDT
            </th>
            <th className="border-border sticky top-8 z-30 border-l bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]">
              {`Sell (${localCurrency})`}
            </th>
            <th className="sticky top-8 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]">
              {`Profit (${localCurrency})`}
            </th>
            <th className="sticky top-8 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]">
              <span className="inline-flex items-center gap-1">
                <TrendingUpDown className="h-3.5 w-3.5" aria-hidden />
                <span>Trend</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((loop, index) => {
            const previousLoop = data[index - 1]
            const changeTry = previousLoop ? loop.profitTry - previousLoop.profitTry : null
            const changePct =
              previousLoop && previousLoop.profitTry !== 0
                ? (changeTry! / previousLoop.profitTry) * 100
                : null
            const isTrendFlat = (changeTry ?? 0) === 0
            const isTrendUp = (changeTry ?? 0) >= 0
            const changeTryLabel =
              changeTry === null
                ? null
                : `${changeTry >= 0 ? '+' : '-'}${localCurrencySymbol}${formatLocal(Math.abs(changeTry))}`

            return (
              <tr key={loop.loop} className="border-t border-black/5 dark:border-white/10">
                <td className="border-border border-r px-3 py-2">{loop.loop}</td>
                <td className="px-3 py-2 text-red-600 dark:text-red-400">
                  <div>
                    <p>
                      -{currencySymbol[loop.buyCurrency]}
                      {loop.buyCurrency === 'USD'
                        ? formatUsd(loop.buyAmount)
                        : formatLocal(loop.buyAmount)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      (
                      {loop.buyRateTry === null
                        ? 'N/A'
                        : `${localCurrencySymbol}${formatRate(loop.buyRateTry)}`}
                      )
                    </p>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Image src={usdtIcon} alt="USDT" width={16} height={16} />
                    <span>{formatUsdtSigned(loop.usdtBought)}</span>
                  </div>
                </td>
                <td className="border-border border-l px-3 py-2">
                  <div>
                    <p>
                      +{localCurrencySymbol}
                      {formatLocal(loop.sellTry)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      ({localCurrencySymbol}
                      {formatRate(loop.sellRateTry)})
                    </p>
                  </div>
                </td>
                <td
                  className={
                    loop.profitTry >= 0
                      ? 'px-3 py-2 text-emerald-600 dark:text-emerald-400'
                      : 'px-3 py-2 text-red-600 dark:text-red-400'
                  }
                >
                  <div>
                    <p>{formatLocalSigned(loop.profitTry, localCurrency)}</p>
                    <p className="text-muted-foreground text-[10px]">
                      ({formatUsdSigned(loop.profitUsd)})
                    </p>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {!previousLoop ? (
                    <span className="text-muted-foreground">---</span>
                  ) : (
                    <div
                      className={
                        isTrendFlat
                          ? 'flex items-center gap-1 text-gray-500 dark:text-gray-400'
                          : isTrendUp
                            ? 'flex items-center gap-1 text-emerald-600 dark:text-emerald-400'
                            : 'flex items-center gap-1 text-red-600 dark:text-red-400'
                      }
                    >
                      <span
                        className={
                          isTrendFlat
                            ? 'text-[10px] font-bold text-gray-500 dark:text-gray-400'
                            : isTrendUp
                              ? 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400'
                              : 'text-[10px] font-bold text-red-600 dark:text-red-400'
                        }
                        aria-hidden
                      >
                        {isTrendFlat ? '■' : isTrendUp ? '▲' : '▼'}
                      </span>
                      <span>
                        {changeTryLabel} ({formatPctSigned(changePct ?? 0)})
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
          {Array.from({ length: emptyRowsCount }).map((_, index) => (
            <tr
              key={`empty-row-${index + 1}`}
              className="text-muted-foreground border-t border-black/5 dark:border-white/10"
            >
              <td className="border-border border-r px-3 py-2">{data.length + index + 1}</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="border-border border-l px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
            </tr>
          ))}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr className="font-semibold">
              <td className="border-border sticky bottom-0 z-30 border-r bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                Total
              </td>
              <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 text-red-600 shadow-[inset_0_1px_0_hsl(var(--border))] dark:text-red-400">
                <div>
                  <p>
                    -{buyCurrency ? currencySymbol[buyCurrency] : localCurrencySymbol}
                    {buyCurrency === 'USD' ? formatUsd(totals.buy) : formatLocal(totals.buy)}
                  </p>
                  <p className="text-muted-foreground text-[10px]">
                    {buyRateTry === null
                      ? '(N/A)'
                      : buyCurrency === 'USD'
                        ? `(${localCurrencySymbol}${formatLocal(totals.buy * buyRateTry)})`
                        : `($${formatUsd(totals.buy / buyRateTry)})`}
                  </p>
                </div>
              </td>
              <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                <span>+{formatUsdt(totals.usdt)}</span>
              </td>
              <td className="border-border sticky bottom-0 z-30 border-l bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                <div>
                  <p>
                    +{localCurrencySymbol}
                    {formatLocal(totals.sellTry)}
                  </p>
                  <p className="text-muted-foreground text-[10px]">
                    {sellRateTry ? `($${formatUsd(totals.sellTry / sellRateTry)})` : '(N/A)'}
                  </p>
                </div>
              </td>
              <td
                className={
                  totals.profitTry >= 0
                    ? 'sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 text-emerald-600 shadow-[inset_0_1px_0_hsl(var(--border))] dark:text-emerald-400'
                    : 'sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 text-red-600 shadow-[inset_0_1px_0_hsl(var(--border))] dark:text-red-400'
                }
              >
                <div>
                  <p>{formatLocalSigned(totals.profitTry, localCurrency)}</p>
                  <p className="text-muted-foreground text-[10px]">
                    ({formatUsdSigned(totals.profitUsd)})
                  </p>
                </div>
              </td>
              <td className="text-muted-foreground sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                ---
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
const formatUsdtSigned = (value: number) =>
  `${value >= 0 ? '+' : '-'}${formatUsdt(Math.abs(value))}`
