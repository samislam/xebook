'use client'

import { PlusIcon, RotateCcwIcon } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { AppTabs } from '@/app/[locale]/composables/app-tabs'
import { useTradebookPage } from '../hooks/use-tradebook-page'
import { CycleToolbar } from '@/app/[locale]/composables/cycle-toolbar'

export const TradebookHeader = () => {
  const tradebook = useTradebookPage()

  return (
    <>
      <div className="mb-6 w-full">
        <AppTabs />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CycleToolbar
          selectedCycleName={tradebook.selectedCycle ?? null}
          onRenameCycle={tradebook.renameSelectedCycle}
          onDeleteCycle={async () => tradebook.requestDeleteCycle()}
          onResetCycle={async () => tradebook.requestResetCycle()}
          isRenaming={tradebook.isCycleRenaming}
          isDeleting={tradebook.isCycleDeleting}
          isResetting={tradebook.isCycleResetting}
        />
        <div className="flex items-center gap-2">
          {tradebook.selectedCycleItem && (
            <Button
              variant="outline"
              onClick={() => tradebook.requestUndoLastTransaction()}
              disabled={tradebook.isCycleUndoing}
            >
              <RotateCcwIcon className="h-4 w-4" />
              {tradebook.isCycleUndoing ? 'Undoing...' : 'Undo last transaction'}
            </Button>
          )}
          <Button variant="default" onClick={tradebook.openCreateTransactionForm}>
            <PlusIcon className="h-4 w-4" />
            Create new transaction
          </Button>
        </div>
      </div>
    </>
  )
}
