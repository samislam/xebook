import Image from 'next/image'
import numeral from 'numeral'
import { TrendingUpDown } from 'lucide-react'
import usdtIcon from '@/media/usdt.svg'
import { type CalculationResult } from './calculate'

type ResultsCardProps = {
  result: CalculationResult | null
}

const formatUsd = (value: number) => numeral(value).format('0,0.00')
const formatTry = (value: number) => numeral(value).format('0,0')
const formatUsdt = (value: number) => numeral(value).format('0,0.00')
const formatRate = (value: number) => numeral(value).format('0,0.00')
const formatTrySigned = (value: number) => `${value >= 0 ? '+' : '-'}₺${formatTry(Math.abs(value))}`
const formatUsdSigned = (value: number) =>
  `${value >= 0 ? '+$' : '-$'}${formatUsd(Math.abs(value))}`
const formatPctSigned = (value: number) =>
  `${value >= 0 ? '+' : '-'}${numeral(Math.abs(value)).format('0,0.00')}%`

export const ResultsCard = ({ result }: ResultsCardProps) => {
  const isProfit = (result?.totalProfitUsd ?? 0) >= 0
  const profitPct =
    result && result.startingUsd > 0 ? (result.totalProfitUsd / result.startingUsd) * 100 : 0
  const profitPctLabel = `${isProfit ? '+' : '-'}${numeral(Math.abs(profitPct)).format('0,0.00')}%`
  const totals = result
    ? result.loops.reduce(
        (acc, loop) => {
          acc.buy += loop.buyAmount
          acc.usdt += loop.usdtBought
          acc.sellTry += loop.sellTry
          acc.profitTry += loop.profitTry
          return acc
        },
        { buy: 0, usdt: 0, sellTry: 0, profitTry: 0 }
      )
    : null
  const firstLoop = result?.loops[0]
  const buyCurrency = firstLoop?.buyCurrency
  const buyRateTry = firstLoop?.buyRateTry ?? null
  const sellRateTry = firstLoop?.sellRateTry ?? null

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <h2 className="mb-2 text-2xl font-bold">Results</h2>
      {!result && (
        <p className="text-muted-foreground text-sm">
          Calculation results will appear here after you submit the form.
        </p>
      )}

      {result && (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <p className="text-muted-foreground">Mode</p>
            <p>{result.mode === 'buy-in-lira' ? 'Buying in lira' : 'Buying in dollars'}</p>

            <p className="text-muted-foreground">Starting capital</p>
            <p>${formatUsd(result.startingUsd)}</p>

            <p className="text-muted-foreground">Final capital</p>
            <p className="flex items-center gap-1">
              <span>
                ${formatUsd(result.finalUsd)} / ₺{formatTry(result.finalTry)}
              </span>
              <span
                className={
                  isProfit
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                ({profitPctLabel})
              </span>
            </p>

            <p className="text-muted-foreground">Total profit</p>
            <div
              className={
                isProfit
                  ? 'flex items-center gap-2 text-emerald-600 dark:text-emerald-400'
                  : 'flex items-center gap-2 text-red-600 dark:text-red-400'
              }
            >
              <span
                className={
                  isProfit
                    ? 'inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-emerald-600 px-1 text-[10px] font-bold text-white dark:bg-emerald-500'
                    : 'inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-red-600 px-1 text-[10px] font-bold text-white dark:bg-red-500'
                }
                aria-hidden
              >
                {isProfit ? '▲' : '▼'}
              </span>
              <span>
                ${formatUsd(result.totalProfitUsd)} / ₺{formatTry(result.totalProfitTry)}
              </span>
            </div>
          </div>

          <div className="border-border max-h-130 overflow-auto rounded-md border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th
                    className="border-border sticky top-0 z-30 border-r bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]"
                    rowSpan={2}
                  >
                    Loop
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
                    Sell (TRY)
                  </th>
                  <th className="sticky top-8 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_-1px_0_hsl(var(--border))]">
                    Profit (TRY)
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
                {result.loops.map((loop, index) => {
                  const previousLoop = result.loops[index - 1]
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
                      : `${changeTry >= 0 ? '+' : '-'}₺${formatTry(Math.abs(changeTry))}`

                  return (
                    <tr key={loop.loop} className="border-t border-black/5 dark:border-white/10">
                      <td className="border-border border-r px-3 py-2">{loop.loop}</td>
                      <td className="px-3 py-2 text-red-600 dark:text-red-400">
                        <div>
                          <p>
                            -{loop.buyCurrency === 'USD' ? '$' : '₺'}
                            {loop.buyCurrency === 'TRY'
                              ? formatTry(loop.buyAmount)
                              : formatUsd(loop.buyAmount)}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            ({loop.buyRateTry === null ? 'N/A' : `₺${formatRate(loop.buyRateTry)}`})
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Image src={usdtIcon} alt="USDT" width={16} height={16} />
                          <span>+{formatUsdt(loop.usdtBought)}</span>
                        </div>
                      </td>
                      <td className="border-border border-l px-3 py-2">
                        <div>
                          <p>+₺{formatTry(loop.sellTry)}</p>
                          <p className="text-muted-foreground text-[10px]">
                            (₺{formatRate(loop.sellRateTry)})
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
                          <p>{formatTrySigned(loop.profitTry)}</p>
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
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="border-border sticky bottom-0 z-30 border-r bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                    Total
                  </td>
                  <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 text-red-600 shadow-[inset_0_1px_0_hsl(var(--border))] dark:text-red-400">
                    <div>
                      <p>
                        -{buyCurrency === 'USD' ? '$' : '₺'}
                        {buyCurrency === 'USD'
                          ? formatUsd(totals?.buy ?? 0)
                          : formatTry(totals?.buy ?? 0)}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {buyRateTry === null
                          ? '(N/A)'
                          : buyCurrency === 'USD'
                            ? `(₺${formatTry((totals?.buy ?? 0) * buyRateTry)})`
                            : `($${formatUsd((totals?.buy ?? 0) / buyRateTry)})`}
                      </p>
                    </div>
                  </td>
                  <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                    <span>+{formatUsdt(totals?.usdt ?? 0)}</span>
                  </td>
                  <td className="border-border sticky bottom-0 z-30 border-l bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                    <div>
                      <p>+₺{formatTry(totals?.sellTry ?? 0)}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {sellRateTry
                          ? `($${formatUsd((totals?.sellTry ?? 0) / sellRateTry)})`
                          : '(N/A)'}
                      </p>
                    </div>
                  </td>
                  <td
                    className={
                      (totals?.profitTry ?? 0) >= 0
                        ? 'sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 text-emerald-600 shadow-[inset_0_1px_0_hsl(var(--border))] dark:text-emerald-400'
                        : 'sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 text-red-600 shadow-[inset_0_1px_0_hsl(var(--border))] dark:text-red-400'
                    }
                  >
                    <div>
                      <p>{formatTrySigned(totals?.profitTry ?? 0)}</p>
                      <p className="text-muted-foreground text-[10px]">
                        ({formatUsdSigned(result.totalProfitUsd)})
                      </p>
                    </div>
                  </td>
                  <td className="text-muted-foreground sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_hsl(var(--border))]">
                    ---
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
