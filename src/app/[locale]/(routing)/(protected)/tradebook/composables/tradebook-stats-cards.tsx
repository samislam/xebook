'use client'

import Image from 'next/image'
import usdtIcon from '@/media/usdt.svg'
import type { TradebookStats } from '../tradebook.types'

type TradebookStatsCardsProps = {
  stats: TradebookStats
  formatUsdt: (value: number) => string
  formatTry: (value: number) => string
}

export const TradebookStatsCards = ({ stats, formatUsdt, formatTry }: TradebookStatsCardsProps) => {
  return (
    <>
      <div
        className={
          stats.currentUsdtBalance >= 0
            ? 'rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4'
            : 'rounded-lg border border-red-500/50 bg-red-500/10 p-4'
        }
      >
        <p
          className={
            stats.currentUsdtBalance >= 0
              ? 'flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300'
              : 'flex items-center gap-1 text-sm font-semibold text-red-700 dark:text-red-300'
          }
        >
          Current USDT
          <Image src={usdtIcon} alt="USDT" width={14} height={14} />
          balance
        </p>
        <p
          className={
            stats.currentUsdtBalance >= 0
              ? 'mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300'
              : 'mt-2 text-3xl font-bold text-red-700 dark:text-red-300'
          }
        >
          {formatUsdt(stats.currentUsdtBalance)}
        </p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <p className="text-muted-foreground flex items-center gap-1 text-xs font-semibold uppercase">
          Total bought
          <Image src={usdtIcon} alt="USDT" width={14} height={14} />
        </p>
        <p className="mt-1 text-xl font-bold">{formatUsdt(stats.boughtUsdt)} USDT</p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <p className="text-muted-foreground flex items-center gap-1 text-xs font-semibold uppercase">
          Total sold
          <Image src={usdtIcon} alt="USDT" width={14} height={14} />
        </p>
        <p className="mt-1 text-xl font-bold">{formatUsdt(stats.soldUsdt)} USDT</p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <p className="text-muted-foreground text-xs font-semibold uppercase">TRY received</p>
        <p className="mt-1 text-xl font-bold">₺{formatTry(stats.receivedTry)}</p>
      </div>

      <div
        className={
          stats.tryProfit >= 0
            ? 'rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4'
            : 'rounded-lg border border-red-500/50 bg-red-500/10 p-4'
        }
      >
        <p
          className={
            stats.tryProfit >= 0
              ? 'text-xs font-semibold text-emerald-700 uppercase dark:text-emerald-300'
              : 'text-xs font-semibold text-red-700 uppercase dark:text-red-300'
          }
        >
          TRY profit
        </p>
        <p
          className={
            stats.tryProfit >= 0
              ? 'mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300'
              : 'mt-1 text-xl font-bold text-red-700 dark:text-red-300'
          }
        >
          {stats.tryProfit >= 0 ? '+' : '-'}₺{formatTry(Math.abs(stats.tryProfit))}
        </p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <p className="text-muted-foreground text-xs font-semibold uppercase">Avg sell price</p>
        <p className="mt-1 text-xl font-bold">₺{formatTry(stats.averageSellPriceTry)}</p>
      </div>
    </>
  )
}
