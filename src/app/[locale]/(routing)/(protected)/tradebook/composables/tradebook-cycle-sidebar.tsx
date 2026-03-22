'use client'

import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { CreateCycleDialog } from './create-cycle.dialog'
import { TradebookStatsCards } from './tradebook-stats-cards'
import type { CycleSummary, TradebookStats } from '../tradebook.types'
import type { CreateCycleFormValues } from '../schemas/create-cycle.schema'

type TradebookCycleSidebarProps = {
  stats: TradebookStats
  cycleSummaries: CycleSummary[]
  selectedCycle: string | null
  transactionCount: number
  nextCycleName: string
  cycleErrorMessage: string | null
  isCycleDialogOpen: boolean
  isCycleSaving: boolean
  onCycleDialogOpenChange: (open: boolean) => void
  onCreateCycle: (values: CreateCycleFormValues) => void
  onSelectCycle: (cycleName: string | null) => void
  formatUsdt: (value: number) => string
  formatTry: (value: number) => string
  formatDateOnly: (value: string) => string
}

const getCycleItemClassName = (selected: boolean) =>
  selected
    ? 'bg-selected text-selected-foreground hover:bg-selected/90 flex w-full cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 text-left'
    : 'hover:bg-selected/60 flex w-full cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 text-left'

export const TradebookCycleSidebar = ({
  stats,
  cycleSummaries,
  selectedCycle,
  transactionCount,
  nextCycleName,
  cycleErrorMessage,
  isCycleDialogOpen,
  isCycleSaving,
  onCycleDialogOpenChange,
  onCreateCycle,
  onSelectCycle,
  formatUsdt,
  formatTry,
  formatDateOnly,
}: TradebookCycleSidebarProps) => {
  return (
    <aside className="space-y-3">
      <TradebookStatsCards stats={stats} formatUsdt={formatUsdt} formatTry={formatTry} />

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase">Profit by cycle</p>
          <Button size="sm" variant="outline" onClick={() => onCycleDialogOpenChange(true)}>
            <PlusIcon className="h-4 w-4" />
            New Cycle
          </Button>
          <CreateCycleDialog
            open={isCycleDialogOpen}
            defaultName={nextCycleName}
            errorMessage={cycleErrorMessage}
            isSaving={isCycleSaving}
            onOpenChange={onCycleDialogOpenChange}
            onSubmit={onCreateCycle}
          />
        </div>
        {cycleSummaries.length === 0 ? (
          <button
            type="button"
            className={getCycleItemClassName(!selectedCycle)}
            onClick={() => onSelectCycle(null)}
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                All
                {!selectedCycle && (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                )}
              </p>
              <p className="text-muted-foreground text-[11px]">No cycles yet</p>
            </div>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className={getCycleItemClassName(!selectedCycle)}
              onClick={() => onSelectCycle(null)}
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  All
                  {!selectedCycle && (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  )}
                </p>
                <p className="text-muted-foreground text-[11px]">{transactionCount} trades total</p>
              </div>
            </button>
            {cycleSummaries.map((item) => (
              <div
                key={item.cycleName}
                className={
                  selectedCycle === item.cycleName
                    ? 'bg-selected text-selected-foreground hover:bg-selected/90 flex cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 last:border-b-0'
                    : 'hover:bg-selected/60 flex cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 last:border-b-0'
                }
                onClick={() => onSelectCycle(item.cycleName)}
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {item.cycleName}
                    {selectedCycle === item.cycleName && (
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                    )}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {formatDateOnly(item.createdAt)} | {item.tradeCount} trades
                  </p>
                </div>
                <p
                  className={
                    item.profitTry >= 0
                      ? 'text-sm font-bold text-emerald-700 dark:text-emerald-300'
                      : 'text-sm font-bold text-red-700 dark:text-red-300'
                  }
                >
                  {item.profitTry >= 0 ? '+' : '-'}₺{formatTry(Math.abs(item.profitTry))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
