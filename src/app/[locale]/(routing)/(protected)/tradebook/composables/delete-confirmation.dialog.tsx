'use client'

import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'

type DeleteConfirmationDialogProps = {
  open: boolean
  cycleName: string | null
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const DeleteConfirmationDialog = ({
  open,
  cycleName,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete transaction?</DialogTitle>
          <DialogDescription>
            This is not the latest transaction in cycle &quot;
            {cycleName ?? ''}
            &quot;. Deleting it may change downstream balances and profit calculations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting || !cycleName}
          >
            {isDeleting ? 'Deleting...' : 'Delete anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
