import numeral from 'numeral'
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

          <div className="border-border overflow-x-auto rounded-md border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="border-border border-r px-3 py-2" rowSpan={2}>
                    Loop
                  </th>
                  <th
                    className="bg-red-100 px-3 py-2 text-center text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    colSpan={2}
                  >
                    BUY
                  </th>
                  <th
                    className="border-border border-l bg-emerald-100 px-3 py-2 text-center text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    colSpan={3}
                  >
                    SELL
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-2">Buy</th>
                  <th className="px-3 py-2">USDT</th>
                  <th className="border-border border-l px-3 py-2">Sell (TRY)</th>
                  <th className="px-3 py-2">Profit (TRY)</th>
                  <th className="px-3 py-2">Trend</th>
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
                      <td className="px-3 py-2">+{formatUsdt(loop.usdtBought)}</td>
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
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
