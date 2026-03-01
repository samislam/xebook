import Image from 'next/image'
import { CURRENCY_SYMBOLS } from '@/constants'
import usdtIcon from '@/media/usdt.svg'

export type TradebookRow = {
  no: number
  id: string
  cycle: string
  occurredAt: string
  type:
    | 'BUY'
    | 'SELL'
    | 'CYCLE_SETTLEMENT'
    | 'DEPOSIT_BALANCE_CORRECTION'
    | 'WITHDRAW_BALANCE_CORRECTION'
  paidLabel: string
  receivedLabel: string
  unitPriceTry: number | null
  commissionPercent: number | null
  usdtDelta: number
  tryDelta: number
  runningUsdtBalance: number
}

type TradebookTransactionsTableProps = {
  rows: TradebookRow[]
  initialRows?: number
  showCycleColumn?: boolean
  onRowClick?: (transactionId: string) => void
}

const truncateToTwoDecimals = (value: number) => Math.trunc(value * 100) / 100

const formatAmount = (value: number) =>
  truncateToTwoDecimals(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const formatUsdt = (value: number) => formatAmount(value)

const formatTry = (value: number) => formatAmount(value)

const formatSignedUsdt = (value: number) =>
  value === 0 ? formatUsdt(0) : `${value > 0 ? '+' : '-'}${formatUsdt(Math.abs(value))}`
const formatSignedTry = (value: number) =>
  value === 0
    ? `${CURRENCY_SYMBOLS.TRY}${formatTry(0)}`
    : `${value > 0 ? '+' : '-'}${CURRENCY_SYMBOLS.TRY}${formatTry(Math.abs(value))}`

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const signedCellClassName = (label: string) => {
  if (label.startsWith('+')) return 'px-3 py-2 text-emerald-600'
  if (label.startsWith('-')) return 'px-3 py-2 text-red-600'
  return 'text-muted-foreground px-3 py-2'
}

const renderSignedLabel = (label: string) => {
  const usdtMatch = /^([+-])USDT\s*(.+)$/.exec(label)
  if (!usdtMatch) return label

  const [, sign, value] = usdtMatch
  return (
    <span className="inline-flex items-center gap-1">
      <Image src={usdtIcon} alt="USDT" width={14} height={14} />
      <span>
        {sign}
        {value}
      </span>
    </span>
  )
}

export const TradebookTransactionsTable = ({
  rows,
  initialRows = 0,
  showCycleColumn = true,
  onRowClick,
}: TradebookTransactionsTableProps) => {
  const emptyRowsCount = Math.max(0, initialRows - rows.length)

  const totals = rows.reduce(
    (acc, row) => {
      acc.usdtDelta += row.usdtDelta
      acc.tryDelta += row.tryDelta
      return acc
    },
    { usdtDelta: 0, tryDelta: 0 }
  )

  return (
    <div className="border-border max-h-130 overflow-auto rounded-md border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="border-border sticky top-0 z-30 border-r bg-[hsl(var(--card))] px-3 py-2">
              No.
            </th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Date</th>
            {showCycleColumn && (
              <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Cycle</th>
            )}
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Type</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Paid</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Received</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Rate (TRY)</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">Commission</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">USDT Δ</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">TRY Δ</th>
            <th className="sticky top-0 z-30 bg-[hsl(var(--card))] px-3 py-2">USDT Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-t border-black/5 dark:border-white/10 ${
                onRowClick ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''
              }`}
              onClick={onRowClick ? () => onRowClick(row.id) : undefined}
            >
              <td className="border-border border-r px-3 py-2">{row.no}</td>
              <td className="px-3 py-2">{formatDateTime(row.occurredAt)}</td>
              {showCycleColumn && <td className="px-3 py-2">{row.cycle}</td>}
              <td className="px-3 py-2">
                <span
                  className={
                    row.type === 'BUY'
                      ? 'inline-flex rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : row.type === 'SELL'
                        ? 'inline-flex rounded bg-blue-100 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : row.type === 'CYCLE_SETTLEMENT'
                          ? 'inline-flex rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : row.type === 'DEPOSIT_BALANCE_CORRECTION'
                            ? 'inline-flex rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'inline-flex rounded bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                  }
                >
                  {row.type === 'CYCLE_SETTLEMENT'
                    ? 'SETTLEMENT'
                    : row.type === 'DEPOSIT_BALANCE_CORRECTION'
                      ? 'DEPOSIT CORR.'
                      : row.type === 'WITHDRAW_BALANCE_CORRECTION'
                        ? 'WITHDRAW CORR.'
                        : row.type}
                </span>
              </td>
              <td className={signedCellClassName(row.paidLabel)}>
                {renderSignedLabel(row.paidLabel)}
              </td>
              <td className={signedCellClassName(row.receivedLabel)}>
                {renderSignedLabel(row.receivedLabel)}
              </td>
              <td className="px-3 py-2">
                {row.unitPriceTry === null
                  ? '-'
                  : `${CURRENCY_SYMBOLS.TRY}${formatTry(row.unitPriceTry)}`}
              </td>
              <td className="px-3 py-2">
                {row.commissionPercent === null
                  ? '-'
                  : `${row.commissionPercent.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}%`}
              </td>
              <td
                className={
                  row.usdtDelta === 0
                    ? 'text-muted-foreground px-3 py-2'
                    : row.usdtDelta > 0
                      ? 'px-3 py-2 text-emerald-600'
                      : 'px-3 py-2 text-red-600'
                }
              >
                {formatSignedUsdt(row.usdtDelta)}
              </td>
              <td
                className={
                  row.tryDelta === 0
                    ? 'text-muted-foreground px-3 py-2'
                    : row.tryDelta > 0
                      ? 'px-3 py-2 text-emerald-600'
                      : 'px-3 py-2 text-red-600'
                }
              >
                {formatSignedTry(row.tryDelta)}
              </td>
              <td className="px-3 py-2 font-semibold">{formatUsdt(row.runningUsdtBalance)}</td>
            </tr>
          ))}

          {Array.from({ length: emptyRowsCount }).map((_, index) => (
            <tr
              key={`empty-tradebook-row-${index + 1}`}
              className="text-muted-foreground border-t border-black/5 dark:border-white/10"
            >
              <td className="border-border border-r px-3 py-2">{rows.length + index + 1}</td>
              <td className="px-3 py-2">-</td>
              {showCycleColumn && <td className="px-3 py-2">-</td>}
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">-</td>
            </tr>
          ))}
        </tbody>

        {rows.length > 0 && (
          <tfoot>
            <tr className="font-semibold">
              <td className="border-border sticky bottom-0 z-30 border-r bg-[hsl(var(--card))] px-3 py-2">
                Total
              </td>
              <td
                className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2"
                colSpan={showCycleColumn ? 7 : 6}
              >
                All transactions
              </td>
              <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2">
                <span
                  className={
                    totals.usdtDelta === 0
                      ? 'text-muted-foreground'
                      : totals.usdtDelta > 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                  }
                >
                  {formatSignedUsdt(totals.usdtDelta)}
                </span>
              </td>
              <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2">
                <span
                  className={
                    totals.tryDelta === 0
                      ? 'text-muted-foreground'
                      : totals.tryDelta > 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                  }
                >
                  {formatSignedTry(totals.tryDelta)}
                </span>
              </td>
              <td className="sticky bottom-0 z-30 bg-[hsl(var(--card))] px-3 py-2">
                {formatUsdt(rows[rows.length - 1]?.runningUsdtBalance ?? 0)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
