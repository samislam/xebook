'use client'

import { appToast } from '@/lib/toast'
import { appApi } from '@/lib/elysia/eden'
import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import type { TradeTransaction } from '../tradebook.types'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import { type CreateTransactionPayload } from './transaction-mutation'
import { TransactionForm, type TransactionFormProps } from './transaction.form'
import { buildTransactionPayload, getSubmissionErrorMessage } from './transaction-mutation'

type CreateTransactionDialogProps = Omit<
  TransactionFormProps,
  'submitLabel' | 'isSubmitting' | 'errorMessage' | 'onSubmit'
> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (transactions: TradeTransaction[]) => void
}

export const CreateTransactionDialog = ({
  open,
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
}: CreateTransactionDialogProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createTransactionMutation = useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const response = await appApi.transactions.post(payload)
      if (response.error) {
        throw new Error(getSubmissionErrorMessage(response.error, 'Failed to create transaction'))
      }
      return Array.isArray(response.data)
        ? (response.data as TradeTransaction[])
        : [response.data as TradeTransaction]
    },
    onSuccess: (createdTransactions) => {
      onSuccess(createdTransactions)
      appToast.success('Transaction created')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to save transaction'
      setErrorMessage(message)
      appToast.fail(message)
    },
  })

  useEffect(() => {
    if (!open) {
      setErrorMessage(null)
      createTransactionMutation.reset()
    }
  }, [open, createTransactionMutation])

  const handleSubmit = async () => {
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

    await createTransactionMutation.mutateAsync(result.payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create transaction</DialogTitle>
          <DialogDescription>Add a BUY or SELL trade entry.</DialogDescription>
        </DialogHeader>
        <TransactionForm
          values={values}
          errorMessage={errorMessage}
          isSubmitting={createTransactionMutation.isPending}
          submitLabel={createTransactionMutation.isPending ? 'Creating...' : 'Create'}
          cycleOptions={cycleOptions}
          institutionOptions={institutionOptions}
          availableCycleUsdtBalance={availableCycleUsdtBalance}
          isSellBalanceWarningVisible={isSellBalanceWarningVisible}
          isCycleLockedBySelection={isCycleLockedBySelection}
          nextCycleName={nextCycleName}
          onValuesChange={onValuesChange}
          onSubmit={() => void handleSubmit()}
          onCancel={onCancel}
          onOpenCreateCycleDialog={onOpenCreateCycleDialog}
          onOpenCreateInstitutionDialog={onOpenCreateInstitutionDialog}
          getInstitutionIconSrc={getInstitutionIconSrc}
        />
      </DialogContent>
    </Dialog>
  )
}
