'use client'

import { appApi } from '@/lib/elysia/eden'
import { CURRENCY_SYMBOLS } from '@/constants'
import { useEffect, useMemo, useState } from 'react'
import { AppTabs } from '../../composables/app-tabs'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Select } from '@/components/ui/shadcnui/select'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { SelectItem } from '@/components/ui/shadcnui/select'
import { TradesTable } from '../../composables/trades-table'
import { SelectValue } from '@/components/ui/shadcnui/select'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { type LoopResult } from '../../composables/calculate'
import { NumberInput } from '@/components/common/number-input'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { SelectTrigger } from '@/components/ui/shadcnui/select'
import { SelectContent } from '@/components/ui/shadcnui/select'
import { DialogTrigger } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'

type TransactionType = 'BUY' | 'SELL'
type TransactionCurrency = 'USD' | 'TRY'

type TradeTransaction = {
  id: string
  type: TransactionType
  occurredAt: string
  createdAt: string
  updatedAt: string
  transactionValue: number | null
  transactionCurrency: TransactionCurrency | null
  amountReceived: number
  amountSold: number | null
  pricePerUnit: number | null
  receivedCurrency: TransactionCurrency
  commissionPercent: number | null
  effectiveRateTry: number | null
}

const nowDateTimeLocal = () => {
  const current = new Date()
  const local = new Date(current.getTime() - current.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const formatUsdt = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatTry = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const TradebookPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [transactions, setTransactions] = useState<TradeTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [transactionType, setTransactionType] = useState<TransactionType>('BUY')
  const [transactionCurrency, setTransactionCurrency] = useState<TransactionCurrency>('USD')
  const [occurredAt, setOccurredAt] = useState(nowDateTimeLocal())
  const [transactionValue, setTransactionValue] = useState('')
  const [buyAmountReceived, setBuyAmountReceived] = useState('')
  const [sellAmountSold, setSellAmountSold] = useState('')
  const [sellAmountReceived, setSellAmountReceived] = useState('')
  const [sellPricePerUnit, setSellPricePerUnit] = useState('')

  const loadTransactions = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { data, error } = await appApi.transactions.get()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to load transactions'
        throw new Error(message)
      }
      setTransactions(data as TradeTransaction[])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load transactions'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTransactions()
  }, [])

  const resetForm = () => {
    setTransactionType('BUY')
    setTransactionCurrency('USD')
    setOccurredAt(nowDateTimeLocal())
    setTransactionValue('')
    setBuyAmountReceived('')
    setSellAmountSold('')
    setSellAmountReceived('')
    setSellPricePerUnit('')
  }

  const createTransaction = async () => {
    setErrorMessage(null)

    const occurredAtIso = new Date(occurredAt).toISOString()
    if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) {
      setErrorMessage('Please provide a valid date and time')
      return
    }

    const payload =
      transactionType === 'BUY'
        ? {
            type: 'BUY' as const,
            transactionValue: Number.parseFloat(transactionValue),
            transactionCurrency,
            occurredAt: occurredAtIso,
            amountReceived: Number.parseFloat(buyAmountReceived),
          }
        : {
            type: 'SELL' as const,
            occurredAt: occurredAtIso,
            amountSold: Number.parseFloat(sellAmountSold),
            amountReceived: sellAmountReceived ? Number.parseFloat(sellAmountReceived) : undefined,
            pricePerUnit: sellPricePerUnit ? Number.parseFloat(sellPricePerUnit) : undefined,
          }

    if (payload.type === 'BUY') {
      if (!Number.isFinite(payload.transactionValue) || payload.transactionValue <= 0) {
        setErrorMessage('Transaction value must be greater than 0')
        return
      }
      if (!Number.isFinite(payload.amountReceived) || payload.amountReceived <= 0) {
        setErrorMessage('Amount received must be greater than 0')
        return
      }
    } else {
      if (!Number.isFinite(payload.amountSold) || payload.amountSold <= 0) {
        setErrorMessage('Amount sold must be greater than 0')
        return
      }
      if (!payload.amountReceived && !payload.pricePerUnit) {
        setErrorMessage('For SELL, provide amount received or price per unit')
        return
      }
      if (
        payload.amountReceived &&
        (!Number.isFinite(payload.amountReceived) || payload.amountReceived <= 0)
      ) {
        setErrorMessage('Amount received must be greater than 0')
        return
      }
      if (
        payload.pricePerUnit &&
        (!Number.isFinite(payload.pricePerUnit) || payload.pricePerUnit <= 0)
      ) {
        setErrorMessage('Price per unit must be greater than 0')
        return
      }
    }

    setIsSaving(true)

    try {
      const { data, error } = await appApi.transactions.post(payload)
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to create transaction'
        throw new Error(message)
      }

      setTransactions((prev) => [...prev, data as TradeTransaction])
      resetForm()
      setIsFormOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transaction'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  const tableData = useMemo<LoopResult[]>(() => {
    return [...transactions]
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
      .map((transaction, index) => {
        if (transaction.type === 'BUY') {
          const buyCurrency = transaction.transactionCurrency === 'TRY' ? 'TRY' : 'USD'
          return {
            loop: index + 1,
            buyAmount: transaction.transactionValue ?? 0,
            buyCurrency,
            buyRateTry: transaction.effectiveRateTry,
            sellRateTry: transaction.effectiveRateTry ?? 0,
            usdtBought: transaction.amountReceived,
            sellTry: 0,
            profitTry: 0,
            profitUsd: 0,
          }
        }

        const amountSold = transaction.amountSold ?? 0
        const pricePerUnit = transaction.pricePerUnit ?? transaction.effectiveRateTry ?? 0
        return {
          loop: index + 1,
          buyAmount: amountSold,
          buyCurrency: 'USD',
          buyRateTry: pricePerUnit || null,
          sellRateTry: pricePerUnit,
          usdtBought: -amountSold,
          sellTry: transaction.amountReceived,
          profitTry: transaction.amountReceived,
          profitUsd: pricePerUnit > 0 ? transaction.amountReceived / pricePerUnit : 0,
        }
      })
  }, [transactions])

  const stats = useMemo(() => {
    const boughtUsdt = transactions
      .filter((transaction) => transaction.type === 'BUY')
      .reduce((sum, transaction) => sum + transaction.amountReceived, 0)

    const soldUsdt = transactions
      .filter((transaction) => transaction.type === 'SELL')
      .reduce((sum, transaction) => sum + (transaction.amountSold ?? 0), 0)

    const receivedTry = transactions
      .filter((transaction) => transaction.type === 'SELL')
      .reduce((sum, transaction) => sum + transaction.amountReceived, 0)

    const currentUsdtBalance = boughtUsdt - soldUsdt
    const averageSellPriceTry = soldUsdt > 0 ? receivedTry / soldUsdt : 0

    return {
      boughtUsdt,
      soldUsdt,
      receivedTry,
      currentUsdtBalance,
      averageSellPriceTry,
    }
  }, [transactions])

  return (
    <div className="relative min-h-screen p-4 pt-16">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="mx-auto mb-6 w-full max-w-7xl">
        <AppTabs />
      </div>

      <div className="mx-auto w-full max-w-7xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Tradebook</h1>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button variant="default">Create new transaction</Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create transaction</DialogTitle>
                <DialogDescription>Add a BUY or SELL trade entry.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold">Type</p>
                  <Select
                    value={transactionType}
                    onValueChange={(value) => setTransactionType(value as TransactionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Datetime</p>
                  <Input
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(event) => setOccurredAt(event.target.value)}
                  />
                </div>

                {transactionType === 'BUY' ? (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-semibold">Transaction value</p>
                      <NumberInput
                        value={transactionValue}
                        onChange={setTransactionValue}
                        startAction={
                          <span className="text-muted-foreground text-sm">
                            {CURRENCY_SYMBOLS[transactionCurrency]}
                          </span>
                        }
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold">Transaction currency</p>
                      <Select
                        value={transactionCurrency}
                        onValueChange={(value) =>
                          setTransactionCurrency(value as TransactionCurrency)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold">Amount received (USDT)</p>
                      <NumberInput
                        value={buyAmountReceived}
                        onChange={setBuyAmountReceived}
                        startAction={
                          <span className="text-muted-foreground text-sm">
                            {CURRENCY_SYMBOLS.USDT}
                          </span>
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-semibold">Amount sold (USDT)</p>
                      <NumberInput value={sellAmountSold} onChange={setSellAmountSold} />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold">Amount received (TRY)</p>
                      <NumberInput value={sellAmountReceived} onChange={setSellAmountReceived} />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold">Price per unit (TRY)</p>
                      <NumberInput value={sellPricePerUnit} onChange={setSellPricePerUnit} />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold">Currency received</p>
                      <Input value="TRY" disabled />
                    </div>
                  </>
                )}
              </div>

              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsFormOpen(false)
                    setErrorMessage(null)
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={() => void createTransaction()} disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Current USDT balance
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatUsdt(stats.currentUsdtBalance)}
              </p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">Total bought</p>
              <p className="mt-1 text-xl font-bold">{formatUsdt(stats.boughtUsdt)} USDT</p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">Total sold</p>
              <p className="mt-1 text-xl font-bold">{formatUsdt(stats.soldUsdt)} USDT</p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">TRY received</p>
              <p className="mt-1 text-xl font-bold">₺{formatTry(stats.receivedTry)}</p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Avg sell price
              </p>
              <p className="mt-1 text-xl font-bold">₺{formatTry(stats.averageSellPriceTry)}</p>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading transactions...</p>
            ) : (
              <TradesTable data={tableData} initialRows={10} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradebookPage
