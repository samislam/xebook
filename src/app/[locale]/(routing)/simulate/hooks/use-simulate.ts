'use client'

import { useContext } from 'react'
import { SimulateContext } from '../providers/simulate-provider'

export const useSimulate = () => {
  const context = useContext(SimulateContext)

  if (!context) {
    throw new Error('useSimulate must be used within SimulateProvider')
  }

  return context
}
