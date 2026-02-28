'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'

type CycleToolbarProps = {
  selectedCycleName: string | null
  onRenameCycle: (name: string) => Promise<void>
  onDeleteCycle: () => Promise<void>
  onResetCycle: () => Promise<void>
  isRenaming: boolean
  isDeleting: boolean
  isResetting: boolean
}

export const CycleToolbar = ({
  selectedCycleName,
  onRenameCycle,
  onDeleteCycle,
  onResetCycle,
  isRenaming,
  isDeleting,
  isResetting,
}: CycleToolbarProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(selectedCycleName ?? '')

  useEffect(() => {
    if (!isEditing) {
      setDraftName(selectedCycleName ?? '')
    }
  }, [selectedCycleName, isEditing])

  const canEdit = Boolean(selectedCycleName)
  const hasSelectedCycle = Boolean(selectedCycleName)
  const canDelete = hasSelectedCycle && !isDeleting && !isRenaming && !isResetting
  const canReset = hasSelectedCycle && !isDeleting && !isRenaming && !isResetting
  const isBusy = isDeleting || isRenaming || isResetting

  const submitRename = async () => {
    if (!selectedCycleName) return
    const nextName = draftName.trim()
    if (!nextName || nextName === selectedCycleName) {
      setIsEditing(false)
      return
    }
    await onRenameCycle(nextName)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-3">
      {isEditing ? (
        <Input
          autoFocus
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={() => void submitRename()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void submitRename()
            }
            if (event.key === 'Escape') {
              setDraftName(selectedCycleName ?? '')
              setIsEditing(false)
            }
          }}
          className="h-10 w-[280px] text-2xl font-bold"
          disabled={isBusy}
        />
      ) : (
        <h1
          className={canEdit ? 'cursor-text text-2xl font-bold' : 'text-2xl font-bold'}
          onDoubleClick={() => {
            if (canEdit && !isBusy) setIsEditing(true)
          }}
          title={canEdit ? 'Double click to edit cycle name' : undefined}
        >
          {selectedCycleName ?? 'All cycles'}
        </h1>
      )}

      {hasSelectedCycle && (
        <>
          <Button variant="outline" disabled={!canReset} onClick={() => void onResetCycle()}>
            {isResetting ? 'Resetting...' : 'Reset cycle'}
          </Button>

          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            disabled={!canDelete}
            onClick={() => void onDeleteCycle()}
          >
            {isDeleting ? 'Deleting...' : 'Delete cycle'}
          </Button>
        </>
      )}
    </div>
  )
}
