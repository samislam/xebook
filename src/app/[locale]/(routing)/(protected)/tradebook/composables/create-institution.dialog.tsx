'use client'

import Image from 'next/image'
import type { RefObject } from 'react'
import { PlusIcon } from 'lucide-react'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'

type CreateInstitutionDialogProps = {
  open: boolean
  institutionName: string
  previewUrl: string | null
  isSaving: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onOpenChange: (open: boolean) => void
  onInstitutionNameChange: (value: string) => void
  onIconChange: (file: File | null) => void
  onCancel: () => void
  onSubmit: () => void
}

export const CreateInstitutionDialog = ({
  open,
  institutionName,
  previewUrl,
  isSaving,
  inputRef,
  onOpenChange,
  onInstitutionNameChange,
  onIconChange,
  onCancel,
  onSubmit,
}: CreateInstitutionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create institution</DialogTitle>
          <DialogDescription>Add a new institution name to use in this form.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Institution</p>
          <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onIconChange(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="bg-muted hover:bg-muted/70 flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-md border"
              onClick={() => inputRef.current?.click()}
              aria-label="Upload institution icon"
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Institution icon preview"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <PlusIcon className="text-muted-foreground h-5 w-5" />
              )}
            </button>
            <Input
              value={institutionName}
              onChange={(event) => onInstitutionNameChange(event.target.value)}
              placeholder="Institution name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!institutionName.trim() || isSaving}>
            {isSaving ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
