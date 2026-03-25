'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import { FolderOpen, Loader2, Trash2 } from 'lucide-react'

type ScenarioListItem = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

type Props = {
  scenarios: ScenarioListItem[]
  isLoading: boolean
  loadingScenarioId: string | null
  deletingScenarioId: string | null
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}

export const PriceCalculatorScenariosDialog = ({
  scenarios,
  isLoading,
  loadingScenarioId,
  deletingScenarioId,
  onLoad,
  onDelete,
}: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <FolderOpen className="mr-2 h-4 w-4" />
          Saved scenarios
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved scenarios</DialogTitle>
          <DialogDescription>Load or delete a saved price-calculator scenario.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center py-10 text-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading scenarios...
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-muted-foreground rounded-2xl border border-dashed p-6 text-sm">
            No saved scenarios yet.
          </div>
        ) : (
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between gap-3 rounded-2xl border p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{scenario.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Updated {new Date(scenario.updatedAt).toLocaleString('en-US')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onLoad(scenario.id)
                      setOpen(false)
                    }}
                    disabled={loadingScenarioId === scenario.id}
                  >
                    {loadingScenarioId === scenario.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Load
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(scenario.id)}
                    disabled={deletingScenarioId === scenario.id}
                  >
                    {deletingScenarioId === scenario.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
