'use client'

import { useEffect, useState } from 'react'
import { appApi } from '@/lib/elysia/eden'
import { appToast } from '@/lib/toast'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import type { TradeTransaction } from '../tradebook.types'
import { useUnsafeEditConfirmDialogStore } from '../hooks/use-unsafe-edit-confirm-dialog'
import { TransactionForm, type TransactionFormProps } from './transaction.form'
import {
  buildTransactionPayload,
  getSubmissionErrorMessage,
  requiresUnsafeEditConfirmation,
  type TradeTransactionRecord,
  type UpdateTransactionPayload,
} from './transaction-mutation'

type UpdateTransactionDialogProps = Omit<
  TransactionFormProps,
  'submitLabel' | 'isSubmitting' | 'errorMessage' | 'onSubmit'
> & {
  open: boolean
  transactionId: string
  editingTransaction: TradeTransactionRecord | null
  transactions: TradeTransactionRecord[]
  onOpenChange: (open: boolean) => void
  onSuccess: (transaction: TradeTransaction) => void
}

export const UpdateTransactionDialog = ({
  open,
  transactionId,
  editingTransaction,
  transactions,
  onOpenChange,
  onSuccess,
  values,
  cycleOptions,
  institutionOptions,
  availableCycleUsdtBalance,
  isSellBalanceWarningVisible,
  isCycleLockedBySelection,
  nextCycleName,
  onValuesChange,
  onCancel,
  onOpenCreateCycleDialog,
  onOpenCreateInstitutionDialog,
  getInstitutionIconSrc,
}: UpdateTransactionDialogProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isUnsafeEditConfirmOpen = useUnsafeEditConfirmDialogStore((state) => state.isOpen)
  const openUnsafeEditConfirmDialog = useUnsafeEditConfirmDialogStore((state) => state.open)
  const closeUnsafeEditConfirmDialog = useUnsafeEditConfirmDialogStore((state) => state.close)

  const updateTransactionMutation = useMutation({
    mutationFn: async (payload: UpdateTransactionPayload) => {
      const response = await appApi.transactions({ id: transactionId }).patch(payload)
      if (response.error) {
        throw new Error(getSubmissionErrorMessage(response.error, 'Failed to update transaction'))
      }
      return response.data as TradeTransaction
    },
    onSuccess: (updatedTransaction) => {
      onSuccess(updatedTransaction)
      closeUnsafeEditConfirmDialog()
      appToast.success('Transaction updated')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to save transaction'
      setErrorMessage(message)
      appToast.fail(message)
    },
  })

  const {
    isPending: isUpdateTransactionPending,
    mutateAsync: updateTransaction,
    reset,
  } = updateTransactionMutation

  useEffect(() => {
    if (!open) {
      setErrorMessage(null)
      closeUnsafeEditConfirmDialog()
      reset()
    }
  }, [closeUnsafeEditConfirmDialog, open, reset])

  const submitUpdate = async (forceUnsafeEdit = false) => {
    setErrorMessage(null)
    const result = buildTransactionPayload({
      values,
      cycleOptions,
      getCycleUsdtBalance: (cycleName) => {
        if (cycleName === values.transactionCycle.trim()) {
          return availableCycleUsdtBalance
        }
        return 0
      },
    })

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    if (!result.payload) {
      return
    }

    if (result.payload.type === 'CYCLE_SETTLEMENT') {
      setErrorMessage('Cycle settlement transactions are not editable')
      return
    }

    if (!forceUnsafeEdit && requiresUnsafeEditConfirmation(editingTransaction, transactions)) {
      openUnsafeEditConfirmDialog()
      return
    }

    await updateTransaction(result.payload)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Update the selected transaction.</DialogDescription>
          </DialogHeader>
          <TransactionForm
            values={values}
            errorMessage={errorMessage}
            isSubmitting={isUpdateTransactionPending}
            submitLabel={isUpdateTransactionPending ? 'Saving...' : 'Save changes'}
            cycleOptions={cycleOptions}
            institutionOptions={institutionOptions}
            availableCycleUsdtBalance={availableCycleUsdtBalance}
            isSellBalanceWarningVisible={isSellBalanceWarningVisible}
            isCycleLockedBySelection={isCycleLockedBySelection}
            nextCycleName={nextCycleName}
            onValuesChange={onValuesChange}
            onSubmit={() => void submitUpdate()}
            onCancel={onCancel}
            onOpenCreateCycleDialog={onOpenCreateCycleDialog}
            onOpenCreateInstitutionDialog={onOpenCreateInstitutionDialog}
            getInstitutionIconSrc={getInstitutionIconSrc}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUnsafeEditConfirmOpen}
        onOpenChange={(open) => {
          if (open) {
            openUnsafeEditConfirmDialog()
            return
          }
          closeUnsafeEditConfirmDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save edit?</DialogTitle>
            <DialogDescription>
              This is not the latest transaction in its cycle. Editing it may change downstream
              balances and profit calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeUnsafeEditConfirmDialog}
              disabled={isUpdateTransactionPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitUpdate(true)}
              disabled={isUpdateTransactionPending}
            >
              {isUpdateTransactionPending ? 'Saving...' : 'Save anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
