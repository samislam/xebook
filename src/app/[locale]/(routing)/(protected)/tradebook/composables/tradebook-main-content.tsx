'use client'

import { useTradebookPage } from '../hooks/use-tradebook-page'
import { TradebookCycleSidebar } from './tradebook-cycle-sidebar'
import { formatDateOnly, formatTry, formatUsdt } from '../tradebook.utils'
import { TradebookCharts } from '@/app/[locale]/composables/tradebook-charts'
import { TradebookTransactionsTable } from '@/app/[locale]/composables/tradebook-transactions-table'

export const TradebookMainContent = () => {
  const tradebook = useTradebookPage()

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <TradebookCycleSidebar
        stats={tradebook.stats}
        cycleSummaries={tradebook.cycleSummaries}
        selectedCycle={tradebook.selectedCycle}
        transactionCount={tradebook.transactions.length}
        nextCycleName={tradebook.nextCycleName}
        cycleErrorMessage={tradebook.cycleErrorMessage}
        isCycleDialogOpen={tradebook.createCycleDialog.isOpen}
        isCycleSaving={tradebook.isCycleSaving}
        onCycleDialogOpenChange={tradebook.handleCycleDialogOpenChange}
        onCreateCycle={(values) => void tradebook.createCycle(values)}
        onSelectCycle={(cycleName) => void tradebook.setSelectedCycle(cycleName)}
        formatUsdt={formatUsdt}
        formatTry={formatTry}
        formatDateOnly={formatDateOnly}
      />

      <div>
        {tradebook.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading transactions...</p>
        ) : (
          <>
            <TradebookTransactionsTable
              rows={tradebook.ledgerRows}
              initialRows={10}
              showCycleColumn={!tradebook.selectedCycle}
              onRowClick={tradebook.transactionDetailsDialog.open}
            />
            <TradebookCharts transactions={tradebook.filteredTransactions} />
          </>
        )}
      </div>
    </div>
  )
}
