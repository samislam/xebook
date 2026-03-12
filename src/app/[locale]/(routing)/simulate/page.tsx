'use client'

import { useState } from 'react'
import { AppTabs } from '../../composables/app-tabs'
import { ResultsCard } from '../../composables/results-card'
import { CalculateForm } from '../../composables/calculate-form'
import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { type CalculationResult } from '../../composables/calculate'
import { LogoutIconButton } from '@/components/common/logout-icon-button'

const SimulatePage = () => {
  const [result, setResult] = useState<CalculationResult | null>(null)

  return (
    <div className="relative h-screen w-full p-4 pt-16">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LogoutIconButton />
        <ThemeSwitcher />
      </div>
      <div className="mb-4 w-full">
        <AppTabs />
      </div>
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:w-1/2">
          <CalculateForm onCalculate={setResult} />
        </div>
        <div className="w-full lg:w-1/2">
          <ResultsCard result={result} />
        </div>
      </div>
    </div>
  )
}

export default SimulatePage
