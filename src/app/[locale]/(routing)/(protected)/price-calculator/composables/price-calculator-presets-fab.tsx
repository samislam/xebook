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
import { CirclePlus, Sparkles } from 'lucide-react'
import { PRICE_CALCULATOR_PRESETS } from '../price-calculator.presets'
import type { ScenarioStep } from '../price-calculator.types'

type Props = {
  onAppendSteps: (steps: ScenarioStep[]) => void
}

export const PriceCalculatorPresetsFab = ({ onAppendSteps }: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="fixed right-4 bottom-4 z-30 h-14 w-14 rounded-full shadow-lg sm:right-6 sm:bottom-6"
          aria-label="Add step preset"
        >
          <CirclePlus className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Step presets
          </DialogTitle>
          <DialogDescription>
            Pick a preset to insert one or more ready-made steps into the scenario.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PRICE_CALCULATOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-white/10 dark:bg-white/5"
              onClick={() => {
                onAppendSteps(preset.steps)
                setOpen(false)
              }}
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <CirclePlus className="h-4 w-4 text-sky-500" />
                {preset.label}
              </div>
              <p className="text-muted-foreground text-sm leading-6">{preset.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
