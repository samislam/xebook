export type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'CYCLE_SETTLEMENT'
  | 'DEPOSIT_BALANCE_CORRECTION'
  | 'WITHDRAW_BALANCE_CORRECTION'

export type TransactionCurrency = 'USD' | 'TRY'
export type BuyInputMode = 'amount-received' | 'price-per-unit'
export type SellInputMode = 'amount-received' | 'price-per-unit'
export type SellFeeUnit = 'percent' | 'usdt'
export type BuyFeeUnit = 'percent' | 'usdt'
export type PendingCycleAction = 'undo-last' | 'reset-cycle' | 'delete-cycle' | null

export type TradeCycle = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type Institution = {
  id: string
  name: string
  iconFileName: string | null
  createdAt: string
  updatedAt: string
}

export type TradeTransaction = {
  id: string
  cycle: string
  type: TransactionType
  occurredAt: string
  createdAt: string
  updatedAt: string
  transactionValue: number | null
  transactionCurrency: TransactionCurrency | null
  usdTryRateAtBuy: number | null
  amountReceived: number
  amountSold: number | null
  pricePerUnit: number | null
  receivedCurrency: TransactionCurrency
  commissionPercent: number | null
  effectiveRateTry: number | null
  description: string | null
  payingWithCash: boolean
  senderInstitution: string | null
  senderIban: string | null
  senderName: string | null
  recipientInstitution: string | null
  recipientIban: string | null
  recipientName: string | null
}

export type CycleOption = {
  id: string
  name: string
}

export type InstitutionOption = {
  name: string
  iconFileName: string | null
}

export type TradebookStats = {
  boughtUsdt: number
  soldUsdt: number
  receivedTry: number
  currentUsdtBalance: number
  averageSellPriceTry: number
  tryProfit: number
}

export type CycleSummary = {
  cycleName: string
  createdAt: string
  profitTry: number
  tradeCount: number
}
