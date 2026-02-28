import numeral from 'numeral'
import { TradesTable } from './trades-table'
import { type CalculationResult } from './calculate'

type ResultsCardProps = {
  result: CalculationResult | null
}

const formatUsd = (value: number) => numeral(value).format('0,0.00')
const formatTry = (value: number) => numeral(value).format('0,0')

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
        </div>
      )}

      <div className={result ? 'mt-4' : 'mt-3'}>
        <TradesTable data={result?.loops ?? []} initialRows={10} />
      </div>
    </section>
  )
}
