'use client'

import { formatAmount } from '../tradebook.utils'
import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { useTradebookPage } from '../hooks/use-tradebook-page'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import { CreateInstitutionDialog } from './create-institution.dialog'
import { CreateTransactionDialog } from './create-transaction.dialog'
import { UpdateTransactionDialog } from './update-transaction.dialog'
import { DeleteConfirmationDialog } from './delete-confirmation.dialog'
import { TransactionDetailsDialog } from './transaction-details.dialog'

export const TradebookDialogs = () => {
  const tradebook = useTradebookPage()

  return (
    <>
      {tradebook.updateTransactionDialog.isOpen && tradebook.updateTransactionDialog.openedItem ? (
        <UpdateTransactionDialog
          open={tradebook.updateTransactionDialog.isOpen}
          transactionId={tradebook.updateTransactionDialog.openedItem}
          editingTransaction={tradebook.editingTransaction}
          transactions={tradebook.transactions}
          onOpenChange={tradebook.handleFormOpenChange}
          values={tradebook.transactionFormValues}
          cycleOptions={tradebook.cycleOptions}
          institutionOptions={tradebook.institutionOptions}
          availableCycleUsdtBalance={tradebook.availableCycleUsdtBalance}
          isSellBalanceWarningVisible={tradebook.isSellBalanceWarningVisible}
          isCycleLockedBySelection={tradebook.isCycleLockedBySelection}
          nextCycleName={tradebook.nextCycleName}
          onValuesChange={tradebook.syncTransactionFormValues}
          onCancel={tradebook.handleFormCancel}
          onOpenCreateCycleDialog={() => tradebook.handleCycleDialogOpenChange(true)}
          onOpenCreateInstitutionDialog={tradebook.openInstitutionDialog}
          getInstitutionIconSrc={tradebook.getInstitutionIconSrc}
          onSuccess={tradebook.handleUpdateTransactionSuccess}
        />
      ) : (
        <CreateTransactionDialog
          open={tradebook.createTransactionDialog.isOpen}
          onOpenChange={tradebook.handleFormOpenChange}
          values={tradebook.transactionFormValues}
          cycleOptions={tradebook.cycleOptions}
          institutionOptions={tradebook.institutionOptions}
          availableCycleUsdtBalance={tradebook.availableCycleUsdtBalance}
          isSellBalanceWarningVisible={tradebook.isSellBalanceWarningVisible}
          isCycleLockedBySelection={tradebook.isCycleLockedBySelection}
          nextCycleName={tradebook.nextCycleName}
          onValuesChange={tradebook.syncTransactionFormValues}
          onCancel={tradebook.handleFormCancel}
          onOpenCreateCycleDialog={() => tradebook.handleCycleDialogOpenChange(true)}
          onOpenCreateInstitutionDialog={tradebook.openInstitutionDialog}
          getInstitutionIconSrc={tradebook.getInstitutionIconSrc}
          onSuccess={tradebook.handleCreateTransactionSuccess}
        />
      )}

      <CreateInstitutionDialog
        open={tradebook.createInstitutionDialog.isOpen}
        institutionName={tradebook.newInstitutionName}
        previewUrl={tradebook.newInstitutionIconPreviewUrl}
        isSaving={tradebook.isInstitutionSaving}
        inputRef={tradebook.institutionIconInputRef}
        onOpenChange={tradebook.handleInstitutionDialogOpenChange}
        onInstitutionNameChange={tradebook.setNewInstitutionName}
        onIconChange={tradebook.setNewInstitutionIcon}
        onCancel={tradebook.handleInstitutionDialogCancel}
        onSubmit={() => void tradebook.createInstitution()}
      />

      {tradebook.cycleToolbarError && (
        <p className="mt-2 text-sm text-red-600">{tradebook.cycleToolbarError}</p>
      )}

      <Dialog
        open={tradebook.cycleActionDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) tradebook.cycleActionDialog.close()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tradebook.cycleConfirmTitle}</DialogTitle>
            <DialogDescription>{tradebook.cycleConfirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={tradebook.cycleActionDialog.close}
              disabled={tradebook.isCycleConfirmActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                tradebook.cycleActionDialog.openedItem === 'delete-cycle'
                  ? 'destructive'
                  : 'default'
              }
              onClick={() => void tradebook.executePendingCycleAction()}
              disabled={tradebook.isCycleConfirmActionLoading}
            >
              {tradebook.isCycleConfirmActionLoading
                ? 'Working...'
                : tradebook.cycleConfirmActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionDetailsDialog
        open={tradebook.transactionDetailsDialog.isOpen}
        transaction={tradebook.selectedTransaction}
        isDeleting={tradebook.isTransactionDeleting}
        onOpenChange={tradebook.handleSelectedTransactionDialogOpenChange}
        onClose={tradebook.transactionDetailsDialog.close}
        onEdit={() => {
          if (!tradebook.selectedTransaction) return
          tradebook.openEditTransactionForm(tradebook.selectedTransaction)
        }}
        onDelete={() => void tradebook.requestDeleteSelectedTransaction()}
        formatAmount={formatAmount}
      />

      <DeleteConfirmationDialog
        open={tradebook.deleteTransactionConfirmationDialog.isOpen}
        cycleName={tradebook.selectedTransaction?.cycle ?? null}
        isDeleting={tradebook.isTransactionDeleting}
        onOpenChange={(open) => {
          if (!open) {
            tradebook.deleteTransactionConfirmationDialog.close()
          }
        }}
        onConfirm={() => {
          if (!tradebook.selectedTransaction) return
          void tradebook.executeDeleteTransaction(tradebook.selectedTransaction.id)
        }}
      />
    </>
  )
}
