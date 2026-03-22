'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'
import type { CalculationResult } from '@/app/[locale]/composables/calculate'

export type SimulateContextValue = {
  result: CalculationResult | null
  setResult: (result: CalculationResult | null) => void
}

const SimulateContext = createContext<SimulateContextValue | null>(null)

type SimulateProviderProps = {
  children: ReactNode
}

export const SimulateProvider = ({ children }: SimulateProviderProps) => {
  const [result, setResult] = useState<CalculationResult | null>(null)

  return (
    <SimulateContext.Provider value={{ result, setResult }}>{children}</SimulateContext.Provider>
  )
}

export const useSimulate = () => {
  const context = useContext(SimulateContext)

  if (!context) {
    throw new Error('useSimulate must be used within SimulateProvider')
  }

  return context
}
