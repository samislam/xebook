'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { AppTabs } from '../composables/app-tabs'
import { ResultsCard } from '../composables/results-card'
import { CalculateForm } from '../composables/calculate-form'
import { type CalculationResult } from '../composables/calculate'
import { ThemeSwitcher } from '@/components/common/theme-switcher'

const Page = () => {
  const [result, setResult] = useState<CalculationResult | null>(null)

  return (
    <div className="relative min-h-screen p-4 pt-16">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="mx-auto mb-4 w-full max-w-7xl">
        <AppTabs />
      </div>
      <div className="mx-auto mb-6 w-full max-w-7xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm leading-relaxed">
        <div className="mb-2 flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          <p>
            This economic feasibility study models a repeated currency-arbitrage loop to estimate
            whether buying USDT and reselling it is profitable after real-world costs. You start
            with USD capital, convert through exchange rates, apply optional bank exchange tax and
            seller commission, sell USDT in Turkish lira, and repeat for a chosen number of loops
            with or without compounding. The calculator then shows per-loop cash flow (buy, USDT
            acquired, sell amount, profit), trend changes between loops, and final totals in both
            USD and TRY, so you can quickly judge if the strategy produces sustainable gains or
            drifts into loss under your actual rates and fees.
          </p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full lg:max-w-2xl">
          <CalculateForm onCalculate={setResult} />
        </div>
        <div className="w-full lg:max-w-2xl">
          <ResultsCard result={result} />
        </div>
      </div>
    </div>
  )
}
export default Page
