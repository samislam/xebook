'use client'

import type { PriceCalculatorSummary } from '../price-calculator.types'

const formatNumber = (value: number, maximumFractionDigits = 2) =>
  value.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
  })

const formatMaybe = (value: number | null, prefix = '') => (value === null ? '-' : `${prefix}${formatNumber(value)}`)
const formatMaybeWithDigits = (value: number | null, prefix = '', maximumFractionDigits = 2) =>
  value === null ? '-' : `${prefix}${formatNumber(value, maximumFractionDigits)}`
const currencyPrefix: Record<'SYP' | 'TRY' | 'USD' | 'USDT', string> = {
  SYP: '£',
  TRY: '₺',
  USD: '$',
  USDT: '$',
}

const profitClass = (value: number | null) =>
  value !== null && value < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'

export const PriceCalculatorSummaryView = ({ summary }: { summary: PriceCalculatorSummary }) => {
  const primaryEffectivePrice =
    summary.effectivePricePerUsdt.SYP !== null
      ? {
          label: 'Effective USDT price',
          value: formatMaybe(summary.effectivePricePerUsdt.SYP, '£'),
          hint: 'Based on your entered SYP costs and current USDT holdings.',
        }
      : summary.effectivePricePerUsdt.TRY !== null
        ? {
            label: 'Effective USDT price',
            value: formatMaybe(summary.effectivePricePerUsdt.TRY, '₺'),
            hint: 'Based on your entered TRY costs and current USDT holdings.',
          }
        : summary.effectivePricePerUsdt.USD !== null
          ? {
              label: 'Effective USDT price',
              value: formatMaybe(summary.effectivePricePerUsdt.USD, '$'),
              hint: 'Based on your entered USD costs and current USDT holdings.',
            }
          : null

  const primarySellPrice =
    summary.targetSell.netPricePerUsdt !== null
      ? formatMaybe(
          summary.targetSell.netPricePerUsdt,
          currencyPrefix[summary.targetSell.currency]
        )
      : null

  const targetSellCurrencyPrefix = currencyPrefix[summary.targetSell.currency]
  const primarySellLabel =
    summary.targetSell.exitMode === 'PRICE'
      ? `Exit price per USDT (${summary.targetSell.currency})`
      : `Suggested sell price per USDT (${summary.targetSell.currency})`
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-emerald-300/60 bg-emerald-50/90 p-5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Your results
        </p>
        {primaryEffectivePrice ? (
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">{primaryEffectivePrice.label}</p>
              <p className="mt-1 text-4xl font-black text-emerald-700 dark:text-emerald-300">
                {primaryEffectivePrice.value}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">{primaryEffectivePrice.hint}</p>
            </div>

            {primarySellPrice && (
              <div className="rounded-2xl border border-emerald-300/60 bg-white/70 p-4 dark:border-emerald-500/20 dark:bg-white/5">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {primarySellLabel}
                </p>
                <p className="mt-2 text-2xl font-black">{primarySellPrice}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ResultMiniCard
                    label="+%"
                    value={
                      summary.targetSell.profitPercent === null
                        ? '-'
                        : `+${formatNumber(summary.targetSell.profitPercent)}%`
                    }
                    valueClassName={profitClass(summary.targetSell.profitPercent)}
                  />
                  <ResultMiniCard
                    label="+Profit"
                    value={formatMaybe(
                      summary.targetSell.targetProfitAmount,
                      targetSellCurrencyPrefix
                    )}
                    valueClassName={profitClass(summary.targetSell.targetProfitAmount)}
                  />
                  <ResultMiniCard
                    label="Previous capital"
                    value={formatMaybe(
                      summary.targetSell.previousCapital,
                      targetSellCurrencyPrefix
                    )}
                  />
                  <ResultMiniCard
                    label="New capital"
                    value={formatMaybe(summary.targetSell.newCapital, targetSellCurrencyPrefix)}
                    valueClassName={profitClass(summary.targetSell.targetProfitAmount)}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-emerald-300/80 bg-white/60 p-4 text-sm dark:border-emerald-500/30 dark:bg-white/5">
            Enter enough steps to acquire some USDT and the calculator will show the effective
            price here.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <h2 className="text-xl font-bold">Current holdings</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(summary.currentHoldings).map(([currency, amount]) => (
            <div key={currency} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-muted-foreground text-xs font-semibold uppercase">{currency}</p>
              <p className="mt-2 text-xl font-black">{formatNumber(amount, currency === 'USDT' ? 4 : 2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <h2 className="text-xl font-bold">Detailed cost basis</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricCard label="Effective price in USD" value={formatMaybe(summary.effectivePricePerUsdt.USD, '$')} />
          <MetricCard label="Effective price in SYP" value={formatMaybe(summary.effectivePricePerUsdt.SYP, '£')} />
          <MetricCard label="Effective price in TRY" value={formatMaybe(summary.effectivePricePerUsdt.TRY, '₺')} />
          <MetricCard
            label="USD bridge USDT rate"
            value={formatMaybeWithDigits(summary.weightedUsdBridgeRate, '$', 4)}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm dark:border-white/10 dark:bg-white/5">
          <p className="font-semibold">Cost breakdown included in USDT basis</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <PlainMetric label="SYP" value={formatNumber(summary.usdtCostVector.SYP)} />
            <PlainMetric label="TRY" value={formatNumber(summary.usdtCostVector.TRY)} />
            <PlainMetric label="USD" value={formatNumber(summary.usdtCostVector.USD)} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <h2 className="text-xl font-bold">Scenario flow</h2>
        <div className="mt-4 space-y-3">
          {summary.previews.map((preview, index) => (
            <div key={`${preview.label}-${index}`} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{preview.label}</p>
                  <p className="text-muted-foreground text-sm">{preview.description}</p>
                </div>
                <div className="text-right text-sm">
                  <p>Source spend: {formatNumber(preview.netSourceAmount)}</p>
                  <p className="text-muted-foreground">
                    Output: {preview.outputAmount === null ? '-' : formatNumber(preview.outputAmount, 4)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {summary.warnings.length > 0 && (
        <section className="rounded-3xl border border-red-200 bg-red-50/80 p-5 shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-300">Warnings</h2>
          <div className="mt-3 space-y-2 text-sm text-red-700 dark:text-red-300">
            {summary.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const MetricCard = ({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
    <p className="text-muted-foreground text-xs font-semibold uppercase">{label}</p>
    <p className={['mt-2 text-xl font-black', valueClassName].filter(Boolean).join(' ')}>{value}</p>
  </div>
)

const PlainMetric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground text-xs font-semibold uppercase">{label}</p>
    <p className="mt-1 text-lg font-bold">{value}</p>
  </div>
)

const ResultMiniCard = ({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">{label}</p>
    <p className={['mt-1 text-lg font-black', valueClassName].filter(Boolean).join(' ')}>{value}</p>
  </div>
)
