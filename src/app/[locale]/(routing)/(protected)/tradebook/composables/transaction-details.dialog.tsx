'use client'

import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import type { TradeTransaction } from '../tradebook.types'

type TransactionDetailsDialogProps = {
  open: boolean
  transaction: TradeTransaction | null
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  formatAmount: (value: number) => string
}

export const TransactionDetailsDialog = ({
  open,
  transaction,
  isDeleting,
  onOpenChange,
  onClose,
  onEdit,
  onDelete,
  formatAmount,
}: TransactionDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
          <DialogDescription>Full information for the selected transaction.</DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="grid grid-cols-1 gap-2 text-sm">
            <p>
              <span className="font-semibold">ID:</span> {transaction.id}
            </p>
            <p>
              <span className="font-semibold">Cycle:</span> {transaction.cycle}
            </p>
            <p>
              <span className="font-semibold">Type:</span> {transaction.type}
            </p>
            <p>
              <span className="font-semibold">Occurred at:</span>{' '}
              {new Date(transaction.occurredAt).toLocaleString('en-US')}
            </p>
            <p>
              <span className="font-semibold">Created at:</span>{' '}
              {new Date(transaction.createdAt).toLocaleString('en-US')}
            </p>
            <p>
              <span className="font-semibold">Updated at:</span>{' '}
              {new Date(transaction.updatedAt).toLocaleString('en-US')}
            </p>
            <p>
              <span className="font-semibold">Transaction value:</span>{' '}
              {transaction.transactionValue === null
                ? '-'
                : formatAmount(transaction.transactionValue)}
            </p>
            <p>
              <span className="font-semibold">Transaction currency:</span>{' '}
              {transaction.transactionCurrency ?? '-'}
            </p>
            <p>
              <span className="font-semibold">USD/TRY rate at buy:</span>{' '}
              {transaction.usdTryRateAtBuy === null
                ? '-'
                : formatAmount(transaction.usdTryRateAtBuy)}
            </p>
            <p>
              <span className="font-semibold">Amount received:</span>{' '}
              {formatAmount(transaction.amountReceived)}
            </p>
            <p>
              <span className="font-semibold">Amount sold:</span>{' '}
              {transaction.amountSold === null ? '-' : formatAmount(transaction.amountSold)}
            </p>
            <p>
              <span className="font-semibold">Price per unit:</span>{' '}
              {transaction.pricePerUnit === null ? '-' : formatAmount(transaction.pricePerUnit)}
            </p>
            <p>
              <span className="font-semibold">Received currency:</span>{' '}
              {transaction.receivedCurrency}
            </p>
            <p>
              <span className="font-semibold">Commission percent:</span>{' '}
              {transaction.commissionPercent === null
                ? '-'
                : `${formatAmount(transaction.commissionPercent)}%`}
            </p>
            <p>
              <span className="font-semibold">Effective rate TRY:</span>{' '}
              {transaction.effectiveRateTry === null
                ? '-'
                : formatAmount(transaction.effectiveRateTry)}
            </p>
            <p>
              <span className="font-semibold">Description:</span> {transaction.description ?? '-'}
            </p>
            <p>
              <span className="font-semibold">Sender institution:</span>{' '}
              {transaction.senderInstitution ?? '-'}
            </p>
            <p>
              <span className="font-semibold">Sender IBAN:</span> {transaction.senderIban ?? '-'}
            </p>
            <p>
              <span className="font-semibold">Sender name:</span> {transaction.senderName ?? '-'}
            </p>
            <p>
              <span className="font-semibold">Recipient institution:</span>{' '}
              {transaction.recipientInstitution ?? '-'}
            </p>
            <p>
              <span className="font-semibold">Recipient IBAN:</span>{' '}
              {transaction.recipientIban ?? '-'}
            </p>
            <p>
              <span className="font-semibold">Recipient name:</span>{' '}
              {transaction.recipientName ?? '-'}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            disabled={!transaction || transaction.type === 'CYCLE_SETTLEMENT'}
          >
            Edit transaction
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
