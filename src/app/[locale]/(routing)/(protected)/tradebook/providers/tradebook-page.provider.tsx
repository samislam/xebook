'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useTradebookPageState } from '../hooks/use-tradebook-page-state'

type TradebookPageContextValue = ReturnType<typeof useTradebookPageState>

const TradebookPageContext = createContext<TradebookPageContextValue | null>(null)

export const TradebookPageProvider = ({ children }: { children: ReactNode }) => {
  const value = useTradebookPageState()
  return <TradebookPageContext.Provider value={value}>{children}</TradebookPageContext.Provider>
}

export const useTradebookPage = () => {
  const value = useContext(TradebookPageContext)
  if (!value) {
    throw new Error('useTradebookPage must be used within TradebookPageProvider')
  }
  return value
}
