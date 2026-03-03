'use client'

import Image from 'next/image'
import { appToast } from '@/lib/toast'
import usdtIcon from '@/media/usdt.svg'
import { appApi } from '@/lib/elysia/eden'
import { CURRENCY_SYMBOLS } from '@/constants'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppTabs } from '../../composables/app-tabs'
import { Input } from '@/components/ui/shadcnui/input'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import { Alert } from '@/components/ui/shadcnui/alert'
import { Button } from '@/components/ui/shadcnui/button'
import { Combobox } from '@/components/ui/shadcnui/combobox'
import { ButtonWithTooltip } from '@/components/ui/shadcnui/button'
import { Accordion } from '@/components/ui/shadcnui/accordion'
import { Select } from '@/components/ui/shadcnui/select'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { AlertTitle } from '@/components/ui/shadcnui/alert'
import { AccordionItem } from '@/components/ui/shadcnui/accordion'
import { SelectItem } from '@/components/ui/shadcnui/select'
import { AlertTriangle, Plus, RotateCcw } from 'lucide-react'
import { SelectValue } from '@/components/ui/shadcnui/select'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { CycleToolbar } from '../../composables/cycle-toolbar'
import { NumberInput } from '@/components/common/number-input'
import { AccordionTrigger } from '@/components/ui/shadcnui/accordion'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { SelectTrigger } from '@/components/ui/shadcnui/select'
import { SelectContent } from '@/components/ui/shadcnui/select'
import { DialogTrigger } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { AlertDescription } from '@/components/ui/shadcnui/alert'
import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { AccordionContent } from '@/components/ui/shadcnui/accordion'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import { TradebookCharts } from '../../composables/tradebook-charts'
import { LogoutIconButton } from '@/components/common/logout-icon-button'
import { TradebookTransactionsTable } from '../../composables/tradebook-transactions-table'

type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'CYCLE_SETTLEMENT'
  | 'DEPOSIT_BALANCE_CORRECTION'
  | 'WITHDRAW_BALANCE_CORRECTION'
type TransactionCurrency = 'USD' | 'TRY'
type BuyInputMode = 'amount-received' | 'price-per-unit'
type SellInputMode = 'amount-received' | 'price-per-unit'
type SellFeeUnit = 'percent' | 'usdt'
type BuyFeeUnit = 'percent' | 'usdt'
type PendingCycleAction = 'undo-last' | 'reset-cycle' | 'delete-cycle' | null

type TradeCycle = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

type Institution = {
  id: string
  name: string
  iconFileName: string | null
  createdAt: string
  updatedAt: string
}

type TradeTransaction = {
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

const nowDateTimeLocal = () => {
  const current = new Date()
  const local = new Date(current.getTime() - current.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const toDateTimeLocal = (value: string) => {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const toInputNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return ''
  if (!Number.isFinite(value)) return ''
  return String(value)
}

const truncateToTwoDecimals = (value: number) => Math.trunc(value * 100) / 100

const formatAmount = (value: number) =>
  truncateToTwoDecimals(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const formatUsdt = (value: number) => formatAmount(value)

const formatTry = (value: number) => formatAmount(value)

const formatDateOnly = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

const getNextCycleName = (cycleNames: string[]) => {
  let maxNumber = 0
  for (const name of cycleNames) {
    const match = /^cycle\s+(\d+)$/i.exec(name.trim())
    if (!match) continue
    const parsed = Number.parseInt(match[1], 10)
    if (Number.isFinite(parsed) && parsed > maxNumber) {
      maxNumber = parsed
    }
  }
  return `Cycle ${maxNumber + 1}`
}

const sortByOccurredAt = (transactions: TradeTransaction[]) =>
  [...transactions].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )

const calculateRealizedTryProfit = (transactions: TradeTransaction[]) => {
  const ordered = sortByOccurredAt(transactions)
  const tryBuyLots: { remainingUsdt: number; unitCostTry: number }[] = []
  let realizedTryProfit = 0

  for (const transaction of ordered) {
    if (transaction.type === 'BUY') {
      if (transaction.transactionValue && transaction.amountReceived > 0) {
        const unitCostTry =
          transaction.effectiveRateTry ??
          (transaction.transactionCurrency === 'TRY'
            ? transaction.transactionValue / transaction.amountReceived
            : transaction.transactionCurrency === 'USD' && transaction.usdTryRateAtBuy
              ? (transaction.transactionValue * transaction.usdTryRateAtBuy) /
                transaction.amountReceived
              : null)

        if (!unitCostTry) continue

        tryBuyLots.push({
          remainingUsdt: transaction.amountReceived,
          unitCostTry,
        })
      }
      continue
    }

    const soldUsdt = transaction.amountSold ?? 0
    if (soldUsdt <= 0) continue

    const sellRateTry = transaction.pricePerUnit ?? transaction.effectiveRateTry ?? 0
    if (sellRateTry <= 0) continue

    let remainingToMatch = soldUsdt
    let matchedUsdt = 0
    let matchedCostTry = 0

    for (const lot of tryBuyLots) {
      if (remainingToMatch <= 0) break
      if (lot.remainingUsdt <= 0) continue

      const matched = Math.min(lot.remainingUsdt, remainingToMatch)
      lot.remainingUsdt -= matched
      remainingToMatch -= matched
      matchedUsdt += matched
      matchedCostTry += matched * lot.unitCostTry
    }

    if (matchedUsdt > 0) {
      realizedTryProfit += matchedUsdt * sellRateTry - matchedCostTry
    }
  }

  return realizedTryProfit
}

const TradebookPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<TradeTransaction[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [cycles, setCycles] = useState<TradeCycle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCycleSaving, setIsCycleSaving] = useState(false)
  const [isInstitutionSaving, setIsInstitutionSaving] = useState(false)
  const [isCycleRenaming, setIsCycleRenaming] = useState(false)
  const [isCycleUndoing, setIsCycleUndoing] = useState(false)
  const [isCycleDeleting, setIsCycleDeleting] = useState(false)
  const [isCycleResetting, setIsCycleResetting] = useState(false)
  const [isTransactionDeleting, setIsTransactionDeleting] = useState(false)
  const [isTransactionUpdating, setIsTransactionUpdating] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [isDeleteTransactionConfirmOpen, setIsDeleteTransactionConfirmOpen] = useState(false)
  const [isEditTransactionConfirmOpen, setIsEditTransactionConfirmOpen] = useState(false)
  const [pendingCycleAction, setPendingCycleAction] = useState<PendingCycleAction>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cycleErrorMessage, setCycleErrorMessage] = useState<string | null>(null)
  const [cycleToolbarError, setCycleToolbarError] = useState<string | null>(null)

  const [transactionType, setTransactionType] = useState<TransactionType>('BUY')
  const [transactionCycle, setTransactionCycle] = useState('')
  const [selectedCycle, setSelectedCycle] = useQueryState('cycle', parseAsString)
  const [transactionCurrency, setTransactionCurrency] = useState<TransactionCurrency>('USD')
  const [occurredAt, setOccurredAt] = useState(nowDateTimeLocal())
  const [transactionValue, setTransactionValue] = useState('')
  const [buyInputMode, setBuyInputMode] = useState<BuyInputMode>('amount-received')
  const [buyAmountReceived, setBuyAmountReceived] = useState('')
  const [buyPricePerUnit, setBuyPricePerUnit] = useState('')
  const [buyUsdTryRateAtBuy, setBuyUsdTryRateAtBuy] = useState('')
  const [buyFee, setBuyFee] = useState('')
  const [buyFeeUnit, setBuyFeeUnit] = useState<BuyFeeUnit>('usdt')
  const [sellAmountSold, setSellAmountSold] = useState('')
  const [sellAmountReceived, setSellAmountReceived] = useState('')
  const [sellPricePerUnit, setSellPricePerUnit] = useState('')
  const [sellFee, setSellFee] = useState('')
  const [sellFeeUnit, setSellFeeUnit] = useState<SellFeeUnit>('usdt')
  const [sellInputMode, setSellInputMode] = useState<SellInputMode>('price-per-unit')
  const [settlementToCycle, setSettlementToCycle] = useState('')
  const [settlementAmount, setSettlementAmount] = useState('')
  const [settlementDescription, setSettlementDescription] = useState('')
  const [correctionAmount, setCorrectionAmount] = useState('')
  const [senderInstitution, setSenderInstitution] = useState('')
  const [senderIban, setSenderIban] = useState('')
  const [senderName, setSenderName] = useState('')
  const [recipientInstitution, setRecipientInstitution] = useState('')
  const [recipientIban, setRecipientIban] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [payingWithCash, setPayingWithCash] = useState(false)
  const [isInstitutionDialogOpen, setIsInstitutionDialogOpen] = useState(false)
  const [newInstitutionName, setNewInstitutionName] = useState('')
  const [newInstitutionIcon, setNewInstitutionIcon] = useState<File | null>(null)
  const [newInstitutionIconPreviewUrl, setNewInstitutionIconPreviewUrl] = useState<string | null>(
    null
  )
  const institutionIconInputRef = useRef<HTMLInputElement | null>(null)
  const [institutionTarget, setInstitutionTarget] = useState<'sender' | 'recipient' | null>(null)
  const [newCycleName, setNewCycleName] = useState('')
  const [cycleSearchTerm, setCycleSearchTerm] = useState('')
  const [isCycleComboboxOpen, setIsCycleComboboxOpen] = useState(false)
  const isCycleLockedBySelection = Boolean(selectedCycle)

  const getCycleUsdtBalance = (cycleName: string) =>
    transactions.reduce((sum, transaction) => {
      if (transaction.cycle !== cycleName) return sum
      if (transaction.type === 'BUY') return sum + transaction.amountReceived
      if (transaction.type === 'SELL') return sum - (transaction.amountSold ?? 0)
      return sum + transaction.amountReceived - (transaction.amountSold ?? 0)
    }, 0)

  const getEffectiveCycle = () => (selectedCycle ?? transactionCycle).trim()

  const availableCycleUsdtBalance = (() => {
    const cycleName = getEffectiveCycle()
    if (!cycleName) return 0
    return Math.max(0, getCycleUsdtBalance(cycleName))
  })()
  const sellAmountSoldValue = Number.parseFloat(sellAmountSold)
  const isSellBalanceWarningVisible =
    transactionType === 'SELL' &&
    Number.isFinite(sellAmountSoldValue) &&
    sellAmountSoldValue > availableCycleUsdtBalance + Number.EPSILON

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
      appToast.fail(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCycles = async () => {
    try {
      const { data, error } = await appApi.transactions.cycles.get()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to load cycles'
        throw new Error(message)
      }
      const sorted = [...(data as TradeCycle[])].sort((a, b) => a.name.localeCompare(b.name))
      setCycles(sorted)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load cycles'
      appToast.info(message)
    }
  }

  const loadInstitutions = async () => {
    try {
      const { data, error } = await appApi.transactions.institutions.get()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to load institutions'
        throw new Error(message)
      }
      setInstitutions((data as Institution[]).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load institutions'
      appToast.info(message)
    }
  }

  useEffect(() => {
    void loadTransactions()
    void loadCycles()
    void loadInstitutions()
  }, [])

  const resetForm = () => {
    setEditingTransactionId(null)
    setTransactionType('BUY')
    const defaultCycle = selectedCycle ?? cycleOptions[0]?.name ?? ''
    setTransactionCycle(defaultCycle)
    setCycleSearchTerm(defaultCycle)
    setTransactionCurrency('USD')
    setOccurredAt(nowDateTimeLocal())
    setTransactionValue('')
    setBuyInputMode('amount-received')
    setBuyAmountReceived('')
    setBuyPricePerUnit('')
    setBuyUsdTryRateAtBuy('')
    setBuyFee('')
    setBuyFeeUnit('usdt')
    setSellAmountSold('')
    setSellAmountReceived('')
    setSellPricePerUnit('')
    setSellFee('')
    setSellFeeUnit('usdt')
    setSellInputMode('price-per-unit')
    setSettlementToCycle('')
    setSettlementAmount('')
    setSettlementDescription('')
    setCorrectionAmount('')
    setSenderInstitution('')
    setSenderIban('')
    setSenderName('')
    setRecipientInstitution('')
    setRecipientIban('')
    setRecipientName('')
    setPayingWithCash(false)
    setNewInstitutionName('')
    setNewInstitutionIcon(null)
    setNewInstitutionIconPreviewUrl(null)
    setInstitutionTarget(null)
  }

  const createTransaction = async (forceUnsafeEdit = false) => {
    setErrorMessage(null)
    const effectiveCycle = getEffectiveCycle()
    const editingTransaction =
      editingTransactionId === null
        ? null
        : (transactions.find((transaction) => transaction.id === editingTransactionId) ?? null)

    const occurredAtIso = new Date(occurredAt).toISOString()
    if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) {
      setErrorMessage('Please provide a valid date and time')
      return
    }
    if (!effectiveCycle) {
      setErrorMessage('Cycle is required')
      return
    }
    if (!cycleOptions.some((cycleItem) => cycleItem.name === effectiveCycle)) {
      setErrorMessage('Please select a valid cycle from the list')
      return
    }

    const payload =
      transactionType === 'BUY'
        ? (() => {
            const transactionValueNumber = Number.parseFloat(transactionValue)
            const buyAmountReceivedNumber = Number.parseFloat(buyAmountReceived)
            const buyPricePerUnitNumber = Number.parseFloat(buyPricePerUnit)
            const usdTryRateAtBuyNumber =
              transactionCurrency === 'USD' && buyUsdTryRateAtBuy
                ? Number.parseFloat(buyUsdTryRateAtBuy)
                : undefined
            const buyFeeNumber = buyFee ? Number.parseFloat(buyFee) : undefined
            const totalTrySpent =
              transactionCurrency === 'TRY'
                ? transactionValueNumber
                : transactionCurrency === 'USD' && usdTryRateAtBuyNumber
                  ? transactionValueNumber * usdTryRateAtBuyNumber
                  : Number.NaN

            const grossBoughtUsdt =
              buyInputMode === 'price-per-unit' &&
              Number.isFinite(buyPricePerUnitNumber) &&
              buyPricePerUnitNumber > 0 &&
              Number.isFinite(totalTrySpent)
                ? totalTrySpent / buyPricePerUnitNumber
                : Number.NaN

            const normalizedBuyAmountReceived =
              buyInputMode === 'amount-received'
                ? buyAmountReceivedNumber
                : Number.isFinite(grossBoughtUsdt)
                  ? buyFeeUnit === 'percent'
                    ? buyFeeNumber !== undefined
                      ? grossBoughtUsdt * (1 - buyFeeNumber / 100)
                      : grossBoughtUsdt
                    : buyFeeNumber !== undefined
                      ? grossBoughtUsdt - buyFeeNumber
                      : grossBoughtUsdt
                  : Number.NaN

            const buyCommissionPercent = (() => {
              if (buyFeeNumber === undefined) return undefined
              if (!Number.isFinite(buyFeeNumber)) return Number.NaN
              if (buyFeeUnit === 'percent') return buyFeeNumber

              if (buyInputMode === 'price-per-unit' && Number.isFinite(grossBoughtUsdt)) {
                if (!Number.isFinite(grossBoughtUsdt) || grossBoughtUsdt <= 0) return Number.NaN
                return (buyFeeNumber / grossBoughtUsdt) * 100
              }

              const receivedUsdt = buyAmountReceivedNumber
              if (!Number.isFinite(receivedUsdt)) return Number.NaN
              const grossUsdt = receivedUsdt + buyFeeNumber
              if (!Number.isFinite(grossUsdt) || grossUsdt <= 0) return Number.NaN
              return (buyFeeNumber / grossUsdt) * 100
            })()

            return {
              cycle: effectiveCycle,
              type: 'BUY' as const,
              transactionValue: transactionValueNumber,
              transactionCurrency,
              usdTryRateAtBuy: usdTryRateAtBuyNumber,
              occurredAt: occurredAtIso,
              amountReceived: normalizedBuyAmountReceived,
              commissionPercent: buyCommissionPercent,
              payingWithCash,
              senderInstitution: payingWithCash ? undefined : senderInstitution.trim() || undefined,
              senderIban: payingWithCash ? undefined : senderIban.trim() || undefined,
              senderName: payingWithCash ? undefined : senderName.trim() || undefined,
              recipientInstitution: payingWithCash
                ? undefined
                : recipientInstitution.trim() || undefined,
              recipientIban: payingWithCash ? undefined : recipientIban.trim() || undefined,
              recipientName: payingWithCash ? undefined : recipientName.trim() || undefined,
            }
          })()
        : transactionType === 'SELL'
          ? {
              cycle: effectiveCycle,
              type: 'SELL' as const,
              occurredAt: occurredAtIso,
              amountSold: Number.parseFloat(sellAmountSold),
              amountReceived:
                sellInputMode === 'amount-received' && sellAmountReceived
                  ? Number.parseFloat(sellAmountReceived)
                  : undefined,
              pricePerUnit:
                sellInputMode === 'price-per-unit' && sellPricePerUnit
                  ? Number.parseFloat(sellPricePerUnit)
                  : undefined,
              commissionPercent: (() => {
                if (!sellFee) return undefined
                const feeValue = Number.parseFloat(sellFee)
                if (!Number.isFinite(feeValue)) return Number.NaN
                if (sellFeeUnit === 'percent') return feeValue

                const soldUsdt = Number.parseFloat(sellAmountSold)

                if (!Number.isFinite(soldUsdt) || soldUsdt <= 0) return Number.NaN
                return (feeValue / soldUsdt) * 100
              })(),
              payingWithCash,
              senderInstitution: payingWithCash ? undefined : senderInstitution.trim() || undefined,
              senderIban: payingWithCash ? undefined : senderIban.trim() || undefined,
              senderName: payingWithCash ? undefined : senderName.trim() || undefined,
              recipientInstitution: payingWithCash
                ? undefined
                : recipientInstitution.trim() || undefined,
              recipientIban: payingWithCash ? undefined : recipientIban.trim() || undefined,
              recipientName: payingWithCash ? undefined : recipientName.trim() || undefined,
            }
          : transactionType === 'CYCLE_SETTLEMENT'
            ? {
                type: 'CYCLE_SETTLEMENT' as const,
                occurredAt: occurredAtIso,
                fromCycle: effectiveCycle,
                toCycle: settlementToCycle.trim(),
                amount: Number.parseFloat(settlementAmount),
                description: settlementDescription.trim() || undefined,
              }
            : {
                cycle: effectiveCycle,
                type:
                  transactionType === 'DEPOSIT_BALANCE_CORRECTION'
                    ? ('DEPOSIT_BALANCE_CORRECTION' as const)
                    : ('WITHDRAW_BALANCE_CORRECTION' as const),
                occurredAt: occurredAtIso,
                amount: Number.parseFloat(correctionAmount),
              }

    if (payload.type === 'BUY') {
      if (!Number.isFinite(payload.transactionValue) || payload.transactionValue <= 0) {
        setErrorMessage('Transaction value must be greater than 0')
        return
      }
      if (!Number.isFinite(payload.amountReceived) || payload.amountReceived <= 0) {
        if (buyInputMode === 'price-per-unit') {
          setErrorMessage('Price per unit and fee produce an invalid received amount')
        } else {
          setErrorMessage('Amount received must be greater than 0')
        }
        return
      }
      if (buyInputMode === 'price-per-unit') {
        const buyPricePerUnitValue = Number.parseFloat(buyPricePerUnit)
        if (!Number.isFinite(buyPricePerUnitValue) || buyPricePerUnitValue <= 0) {
          setErrorMessage('Price per unit must be greater than 0')
          return
        }
      }
      if (payload.transactionCurrency === 'USD') {
        if (!payload.usdTryRateAtBuy) {
          setErrorMessage('USD/TRY rate at buy is required for USD buys')
          return
        }
        if (!Number.isFinite(payload.usdTryRateAtBuy) || payload.usdTryRateAtBuy <= 0) {
          setErrorMessage('USD/TRY rate at buy must be greater than 0')
          return
        }
      }
      if (
        payload.commissionPercent !== undefined &&
        (!Number.isFinite(payload.commissionPercent) ||
          payload.commissionPercent < 0 ||
          payload.commissionPercent >= 100)
      ) {
        setErrorMessage('Fee must be between 0 and less than 100')
        return
      }
    } else if (payload.type === 'SELL') {
      if (!Number.isFinite(payload.amountSold) || payload.amountSold <= 0) {
        setErrorMessage('Amount sold must be greater than 0')
        return
      }
      if (sellInputMode === 'amount-received' && !payload.amountReceived) {
        setErrorMessage('For SELL, provide amount received')
        return
      }
      if (sellInputMode === 'price-per-unit' && !payload.pricePerUnit) {
        setErrorMessage('For SELL, provide price per unit')
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
      if (
        payload.commissionPercent !== undefined &&
        (!Number.isFinite(payload.commissionPercent) || payload.commissionPercent < 0)
      ) {
        setErrorMessage('Fee must be 0 or greater')
        return
      }
    } else if (payload.type === 'CYCLE_SETTLEMENT') {
      if (!payload.fromCycle) {
        setErrorMessage('Source cycle is required')
        return
      }
      if (!payload.toCycle) {
        setErrorMessage('Destination cycle is required')
        return
      }
      if (payload.fromCycle === payload.toCycle) {
        setErrorMessage('Source and destination cycles must be different')
        return
      }
      if (!cycleOptions.some((cycleItem) => cycleItem.name === payload.toCycle)) {
        setErrorMessage('Please select a valid destination cycle from the list')
        return
      }
      if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        setErrorMessage('Settlement amount must be greater than 0')
        return
      }
      const sourceBalance = Math.max(0, getCycleUsdtBalance(payload.fromCycle))
      if (payload.amount > sourceBalance + Number.EPSILON) {
        setErrorMessage(
          `Settlement amount exceeds source cycle balance (${formatUsdt(sourceBalance)} USDT)`
        )
        return
      }
    } else {
      if (!payload.cycle) {
        setErrorMessage('Cycle is required')
        return
      }
      if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        setErrorMessage('Correction amount must be greater than 0')
        return
      }
      if (payload.type === 'WITHDRAW_BALANCE_CORRECTION') {
        const cycleBalance = Math.max(0, getCycleUsdtBalance(payload.cycle))
        if (payload.amount > cycleBalance + Number.EPSILON) {
          setErrorMessage(
            `Withdraw correction exceeds cycle balance (${formatUsdt(cycleBalance)} USDT)`
          )
          return
        }
      }
    }

    if (
      editingTransaction &&
      !forceUnsafeEdit &&
      transactionType !== 'CYCLE_SETTLEMENT' &&
      (() => {
        const cycleTransactions = transactions
          .filter((transaction) => transaction.cycle === editingTransaction.cycle)
          .sort(
            (a, b) =>
              new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        return cycleTransactions[0]?.id !== editingTransaction.id
      })()
    ) {
      setIsEditTransactionConfirmOpen(true)
      return
    }

    if (editingTransaction) {
      if (payload.type === 'CYCLE_SETTLEMENT') {
        setErrorMessage('Cycle settlement transactions are not editable')
        return
      }
      setIsTransactionUpdating(true)
    } else {
      setIsSaving(true)
    }

    try {
      let data: unknown
      let error: {
        value?: unknown
      } | null = null
      if (editingTransaction) {
        if (payload.type === 'CYCLE_SETTLEMENT') {
          throw new Error('Cycle settlement transactions are not editable')
        }
        const updatePayload: Exclude<typeof payload, { type: 'CYCLE_SETTLEMENT' }> = payload
        const response = await appApi
          .transactions({ id: editingTransaction.id })
          .patch(updatePayload)
        data = response.data
        error = response.error
      } else {
        const response = await appApi.transactions.post(payload)
        data = response.data
        error = response.error
      }
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

      if (editingTransaction) {
        const updated = data as TradeTransaction
        setTransactions((prev) =>
          prev.map((transaction) => (transaction.id === updated.id ? updated : transaction))
        )
      } else {
        const createdTransactions = Array.isArray(data)
          ? (data as TradeTransaction[])
          : [data as TradeTransaction]
        setTransactions((prev) => [...prev, ...createdTransactions])
      }
      void loadCycles()
      resetForm()
      setIsFormOpen(false)
      setIsEditTransactionConfirmOpen(false)
      appToast.success(editingTransaction ? 'Transaction updated' : 'Transaction created')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save transaction'
      setErrorMessage(message)
      appToast.fail(message)
    } finally {
      if (editingTransaction) {
        setIsTransactionUpdating(false)
      } else {
        setIsSaving(false)
      }
    }
  }

  const createCycle = async () => {
    setCycleErrorMessage(null)
    const name = newCycleName.trim()
    if (!name) {
      setCycleErrorMessage('Cycle name is required')
      return
    }

    setIsCycleSaving(true)
    try {
      const { data, error } = await appApi.transactions.cycles.post({ name })
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to create cycle'
        throw new Error(message)
      }

      const created = data as TradeCycle
      setCycles((prev) => {
        const exists = prev.some((cycleItem) => cycleItem.name === created.name)
        if (exists) return prev
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      })
      setTransactionCycle(created.name)
      setCycleSearchTerm(created.name)
      setNewCycleName('')
      setIsCycleDialogOpen(false)
      appToast.success('Cycle created')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create cycle'
      setCycleErrorMessage(message)
      appToast.fail(message)
    } finally {
      setIsCycleSaving(false)
    }
  }

  const cycleOptions = useMemo(() => {
    const map = new Map<string, TradeCycle>()
    for (const cycleItem of cycles) {
      map.set(cycleItem.name, cycleItem)
    }
    for (const transaction of transactions) {
      if (!map.has(transaction.cycle)) {
        map.set(transaction.cycle, {
          id: transaction.cycle,
          name: transaction.cycle,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [cycles, transactions])

  const selectedCycleItem = useMemo(
    () => cycleOptions.find((item) => item.name === selectedCycle) ?? null,
    [cycleOptions, selectedCycle]
  )

  const renameSelectedCycle = async (name: string) => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)
    setIsCycleRenaming(true)

    try {
      const { data, error } = await appApi.transactions.cycles({ id: selectedCycleItem.id }).patch({
        name,
      })
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to rename cycle'
        throw new Error(message)
      }

      const updated = data as TradeCycle
      setSelectedCycle(updated.name)
      setTransactionCycle((prev) => (prev === selectedCycleItem.name ? updated.name : prev))
      setCycleSearchTerm((prev) => (prev === selectedCycleItem.name ? updated.name : prev))
      await Promise.all([loadCycles(), loadTransactions()])
      appToast.success('Cycle renamed')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename cycle'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    } finally {
      setIsCycleRenaming(false)
    }
  }

  const deleteSelectedCycle = async () => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)
    setIsCycleDeleting(true)

    try {
      const { error } = await appApi.transactions.cycles({ id: selectedCycleItem.id }).delete()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to delete cycle'
        throw new Error(message)
      }
      setSelectedCycle(null)
      if (transactionCycle === selectedCycleItem.name) {
        setTransactionCycle('')
        setCycleSearchTerm('')
      }
      await Promise.all([loadCycles(), loadTransactions()])
      appToast.success('Cycle deleted')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete cycle'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    } finally {
      setIsCycleDeleting(false)
    }
  }

  const undoLastTransactionInSelectedCycle = async () => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)
    setIsCycleUndoing(true)

    try {
      const { error } = await appApi.transactions
        .cycles({ id: selectedCycleItem.id })
        .undoLast.post()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to undo last transaction'
        throw new Error(message)
      }

      await loadTransactions()
      appToast.success('Last transaction undone')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to undo last transaction'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    } finally {
      setIsCycleUndoing(false)
    }
  }

  const resetSelectedCycle = async () => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)
    setIsCycleResetting(true)

    try {
      const { error } = await appApi.transactions.cycles({ id: selectedCycleItem.id }).reset.post()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to reset cycle'
        throw new Error(message)
      }

      await loadTransactions()
      appToast.success('Cycle reset')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset cycle'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    } finally {
      setIsCycleResetting(false)
    }
  }

  const requestUndoLastTransaction = () => {
    if (!selectedCycleItem) return
    setPendingCycleAction('undo-last')
  }

  const requestResetCycle = () => {
    if (!selectedCycleItem) return
    setPendingCycleAction('reset-cycle')
  }

  const requestDeleteCycle = () => {
    if (!selectedCycleItem) return
    setPendingCycleAction('delete-cycle')
  }

  const executePendingCycleAction = async () => {
    if (!pendingCycleAction) return

    let success = false
    if (pendingCycleAction === 'undo-last') {
      success = await undoLastTransactionInSelectedCycle()
    } else if (pendingCycleAction === 'reset-cycle') {
      success = await resetSelectedCycle()
    } else if (pendingCycleAction === 'delete-cycle') {
      success = await deleteSelectedCycle()
    }

    if (success) {
      setPendingCycleAction(null)
    }
  }

  const isCycleConfirmActionLoading = isCycleUndoing || isCycleResetting || isCycleDeleting
  const cycleConfirmTitle =
    pendingCycleAction === 'undo-last'
      ? 'Undo last transaction?'
      : pendingCycleAction === 'reset-cycle'
        ? 'Reset cycle?'
        : pendingCycleAction === 'delete-cycle'
          ? 'Delete cycle?'
          : ''
  const cycleConfirmDescription =
    pendingCycleAction === 'undo-last'
      ? `This will remove the latest transaction from "${selectedCycleItem?.name ?? ''}".`
      : pendingCycleAction === 'reset-cycle'
        ? `This will remove all transactions from "${selectedCycleItem?.name ?? ''}".`
        : pendingCycleAction === 'delete-cycle'
          ? `This will remove all transactions and permanently delete "${selectedCycleItem?.name ?? ''}".`
          : ''
  const cycleConfirmActionLabel =
    pendingCycleAction === 'undo-last'
      ? 'Undo transaction'
      : pendingCycleAction === 'reset-cycle'
        ? 'Reset cycle'
        : pendingCycleAction === 'delete-cycle'
          ? 'Delete cycle'
          : 'Confirm'

  const filteredTransactions = useMemo(() => {
    if (!selectedCycle) return transactions
    return transactions.filter((transaction) => transaction.cycle === selectedCycle)
  }, [transactions, selectedCycle])

  const selectedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null,
    [transactions, selectedTransactionId]
  )

  const isSelectedTransactionLastInCycle = useMemo(() => {
    if (!selectedTransaction) return false
    const cycleTransactions = transactions
      .filter((transaction) => transaction.cycle === selectedTransaction.cycle)
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    return cycleTransactions[0]?.id === selectedTransaction.id
  }, [selectedTransaction, transactions])

  const executeDeleteTransaction = async (transactionId: string) => {
    setIsTransactionDeleting(true)
    try {
      const { error } = await appApi.transactions({ id: transactionId }).delete()
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to delete transaction'
        throw new Error(message)
      }

      setTransactions((prev) => prev.filter((transaction) => transaction.id !== transactionId))
      setSelectedTransactionId(null)
      setIsDeleteTransactionConfirmOpen(false)
      appToast.success('Transaction deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction'
      appToast.fail(message)
    } finally {
      setIsTransactionDeleting(false)
    }
  }

  const requestDeleteSelectedTransaction = async () => {
    if (!selectedTransaction) return
    if (isSelectedTransactionLastInCycle) {
      await executeDeleteTransaction(selectedTransaction.id)
      return
    }
    setIsDeleteTransactionConfirmOpen(true)
  }

  const openEditTransactionForm = (transaction: TradeTransaction) => {
    setEditingTransactionId(transaction.id)
    setErrorMessage(null)
    setIsEditTransactionConfirmOpen(false)

    setTransactionType(transaction.type)
    setTransactionCycle(transaction.cycle)
    setCycleSearchTerm(transaction.cycle)
    setOccurredAt(toDateTimeLocal(transaction.occurredAt))

    if (transaction.type === 'BUY') {
      setTransactionCurrency(transaction.transactionCurrency ?? 'USD')
      setTransactionValue(toInputNumber(transaction.transactionValue))
      setBuyInputMode('amount-received')
      setBuyAmountReceived(toInputNumber(transaction.amountReceived))
      setBuyPricePerUnit('')
      setBuyUsdTryRateAtBuy(toInputNumber(transaction.usdTryRateAtBuy))
      setBuyFee(
        transaction.commissionPercent !== null ? toInputNumber(transaction.commissionPercent) : ''
      )
      setBuyFeeUnit(transaction.commissionPercent !== null ? 'percent' : 'usdt')
      setSellAmountSold('')
      setSellAmountReceived('')
      setSellPricePerUnit('')
      setSellFee('')
      setSettlementAmount('')
      setSettlementToCycle('')
      setSettlementDescription('')
      setCorrectionAmount('')
      setSenderInstitution(transaction.senderInstitution ?? '')
      setSenderIban(transaction.senderIban ?? '')
      setSenderName(transaction.senderName ?? '')
      setRecipientInstitution(transaction.recipientInstitution ?? '')
      setRecipientIban(transaction.recipientIban ?? '')
      setRecipientName(transaction.recipientName ?? '')
      setPayingWithCash(transaction.payingWithCash)
    } else if (transaction.type === 'SELL') {
      setSellAmountSold(toInputNumber(transaction.amountSold))
      if (transaction.pricePerUnit !== null) {
        setSellInputMode('price-per-unit')
        setSellPricePerUnit(toInputNumber(transaction.pricePerUnit))
        setSellAmountReceived('')
      } else {
        setSellInputMode('amount-received')
        setSellAmountReceived(toInputNumber(transaction.amountReceived))
        setSellPricePerUnit('')
      }
      setSellFee(
        transaction.commissionPercent !== null ? toInputNumber(transaction.commissionPercent) : ''
      )
      setSellFeeUnit(transaction.commissionPercent !== null ? 'percent' : 'usdt')
      setTransactionValue('')
      setBuyAmountReceived('')
      setBuyPricePerUnit('')
      setBuyUsdTryRateAtBuy('')
      setBuyFee('')
      setSettlementAmount('')
      setSettlementToCycle('')
      setSettlementDescription('')
      setCorrectionAmount('')
      setSenderInstitution(transaction.senderInstitution ?? '')
      setSenderIban(transaction.senderIban ?? '')
      setSenderName(transaction.senderName ?? '')
      setRecipientInstitution(transaction.recipientInstitution ?? '')
      setRecipientIban(transaction.recipientIban ?? '')
      setRecipientName(transaction.recipientName ?? '')
      setPayingWithCash(transaction.payingWithCash)
    } else if (
      transaction.type === 'DEPOSIT_BALANCE_CORRECTION' ||
      transaction.type === 'WITHDRAW_BALANCE_CORRECTION'
    ) {
      setCorrectionAmount(
        transaction.type === 'DEPOSIT_BALANCE_CORRECTION'
          ? toInputNumber(transaction.amountReceived)
          : toInputNumber(transaction.amountSold)
      )
      setTransactionValue('')
      setBuyAmountReceived('')
      setBuyPricePerUnit('')
      setBuyUsdTryRateAtBuy('')
      setBuyFee('')
      setSellAmountSold('')
      setSellAmountReceived('')
      setSellPricePerUnit('')
      setSellFee('')
      setSettlementAmount('')
      setSettlementToCycle('')
      setSettlementDescription('')
      setSenderInstitution('')
      setSenderIban('')
      setSenderName('')
      setRecipientInstitution('')
      setRecipientIban('')
      setRecipientName('')
      setPayingWithCash(false)
    } else {
      appToast.info('Cycle settlement transactions cannot be edited yet')
      return
    }

    setSelectedTransactionId(null)
    setIsFormOpen(true)
  }

  const ledgerRows = useMemo(() => {
    const ordered = [...filteredTransactions].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    )
    const institutionIconByName = new Map(
      institutions.map((institution) => [
        institution.name.trim().toLowerCase(),
        institution.iconFileName,
      ])
    )
    const tryBuyLots: { remainingUsdt: number; unitCostTry: number }[] = []

    let runningUsdt = 0

    return ordered.map((transaction, index) => {
      if (transaction.type === 'BUY') {
        const paidCurrency = transaction.transactionCurrency ?? 'USD'
        const paidSymbol = CURRENCY_SYMBOLS[paidCurrency]
        const paidValue = transaction.transactionValue ?? 0
        const usdtDelta = transaction.amountReceived
        const tryDelta = paidCurrency === 'TRY' ? -paidValue : 0
        const paymentMethodName = transaction.payingWithCash
          ? 'cash'
          : transaction.senderInstitution?.trim() || null
        const unitCostTry =
          transaction.effectiveRateTry ??
          (transaction.transactionCurrency === 'TRY'
            ? transaction.transactionValue && transaction.amountReceived > 0
              ? transaction.transactionValue / transaction.amountReceived
              : null
            : transaction.transactionCurrency === 'USD' && transaction.usdTryRateAtBuy
              ? transaction.transactionValue && transaction.amountReceived > 0
                ? (transaction.transactionValue * transaction.usdTryRateAtBuy) /
                  transaction.amountReceived
                : null
              : null)
        if (unitCostTry) {
          tryBuyLots.push({
            remainingUsdt: transaction.amountReceived,
            unitCostTry,
          })
        }
        runningUsdt += usdtDelta

        return {
          no: index + 1,
          id: transaction.id,
          cycle: transaction.cycle,
          occurredAt: transaction.occurredAt,
          type: 'BUY' as const,
          paymentMethodName,
          paymentMethodIconFileName: paymentMethodName
            ? (institutionIconByName.get(paymentMethodName.toLowerCase()) ?? null)
            : null,
          paidLabel:
            paidCurrency === 'TRY'
              ? `-${paidSymbol}${formatTry(paidValue)}`
              : `-${paidSymbol}${formatUsdt(paidValue)}`,
          receivedLabel: `+${CURRENCY_SYMBOLS.USDT} ${formatUsdt(transaction.amountReceived)}`,
          unitPriceTry: transaction.effectiveRateTry,
          commissionPercent: transaction.commissionPercent,
          rowProfitTry: null,
          usdtDelta,
          tryDelta,
          runningUsdtBalance: runningUsdt,
        }
      }

      if (transaction.type === 'SELL') {
        const soldUsdt = transaction.amountSold ?? 0
        const usdtDelta = -soldUsdt
        const tryDelta = transaction.amountReceived
        const paymentMethodName = transaction.payingWithCash
          ? 'cash'
          : transaction.recipientInstitution?.trim() || null
        const sellRateTry = transaction.pricePerUnit ?? transaction.effectiveRateTry ?? 0
        let rowProfitTry: number | null = null
        if (soldUsdt > 0 && sellRateTry > 0) {
          let remainingToMatch = soldUsdt
          let matchedUsdt = 0
          let matchedCostTry = 0

          for (const lot of tryBuyLots) {
            if (remainingToMatch <= 0) break
            if (lot.remainingUsdt <= 0) continue

            const matched = Math.min(lot.remainingUsdt, remainingToMatch)
            lot.remainingUsdt -= matched
            remainingToMatch -= matched
            matchedUsdt += matched
            matchedCostTry += matched * lot.unitCostTry
          }

          if (matchedUsdt > 0) {
            rowProfitTry = matchedUsdt * sellRateTry - matchedCostTry
          }
        }
        runningUsdt += usdtDelta

        return {
          no: index + 1,
          id: transaction.id,
          cycle: transaction.cycle,
          occurredAt: transaction.occurredAt,
          type: 'SELL' as const,
          paymentMethodName,
          paymentMethodIconFileName: paymentMethodName
            ? (institutionIconByName.get(paymentMethodName.toLowerCase()) ?? null)
            : null,
          paidLabel: `-${CURRENCY_SYMBOLS.USDT} ${formatUsdt(soldUsdt)}`,
          receivedLabel: `+${CURRENCY_SYMBOLS.TRY}${formatTry(transaction.amountReceived)}`,
          unitPriceTry: transaction.pricePerUnit ?? transaction.effectiveRateTry,
          commissionPercent: transaction.commissionPercent,
          rowProfitTry,
          usdtDelta,
          tryDelta,
          runningUsdtBalance: runningUsdt,
        }
      }

      if (transaction.type === 'CYCLE_SETTLEMENT') {
        const settlementOut = transaction.amountSold ?? 0
        const settlementIn = transaction.amountReceived
        const usdtDelta = settlementIn - settlementOut
        const tryDelta = 0
        runningUsdt += usdtDelta

        return {
          no: index + 1,
          id: transaction.id,
          cycle: transaction.cycle,
          occurredAt: transaction.occurredAt,
          type: 'CYCLE_SETTLEMENT' as const,
          paymentMethodName: null,
          paymentMethodIconFileName: null,
          paidLabel:
            settlementOut > 0 ? `-${CURRENCY_SYMBOLS.USDT} ${formatUsdt(settlementOut)}` : '-',
          receivedLabel:
            settlementIn > 0 ? `+${CURRENCY_SYMBOLS.USDT} ${formatUsdt(settlementIn)}` : '-',
          unitPriceTry: null,
          commissionPercent: null,
          rowProfitTry: null,
          usdtDelta,
          tryDelta,
          runningUsdtBalance: runningUsdt,
        }
      }

      if (transaction.type === 'DEPOSIT_BALANCE_CORRECTION') {
        const usdtDelta = transaction.amountReceived
        runningUsdt += usdtDelta
        return {
          no: index + 1,
          id: transaction.id,
          cycle: transaction.cycle,
          occurredAt: transaction.occurredAt,
          type: 'DEPOSIT_BALANCE_CORRECTION' as const,
          paymentMethodName: null,
          paymentMethodIconFileName: null,
          paidLabel: '-',
          receivedLabel: `+${CURRENCY_SYMBOLS.USDT} ${formatUsdt(transaction.amountReceived)}`,
          unitPriceTry: null,
          commissionPercent: null,
          rowProfitTry: null,
          usdtDelta,
          tryDelta: 0,
          runningUsdtBalance: runningUsdt,
        }
      }

      const withdrawnUsdt = transaction.amountSold ?? 0
      const usdtDelta = -withdrawnUsdt
      runningUsdt += usdtDelta
      return {
        no: index + 1,
        id: transaction.id,
        cycle: transaction.cycle,
        occurredAt: transaction.occurredAt,
        type: 'WITHDRAW_BALANCE_CORRECTION' as const,
        paymentMethodName: null,
        paymentMethodIconFileName: null,
        paidLabel: `-${CURRENCY_SYMBOLS.USDT} ${formatUsdt(withdrawnUsdt)}`,
        receivedLabel: '-',
        unitPriceTry: null,
        commissionPercent: null,
        rowProfitTry: null,
        usdtDelta,
        tryDelta: 0,
        runningUsdtBalance: runningUsdt,
      }
    })
  }, [filteredTransactions, institutions])

  const stats = useMemo(() => {
    const boughtUsdt = filteredTransactions
      .filter((transaction) => transaction.type === 'BUY')
      .reduce((sum, transaction) => sum + transaction.amountReceived, 0)

    const soldUsdt = filteredTransactions
      .filter((transaction) => transaction.type === 'SELL')
      .reduce((sum, transaction) => sum + (transaction.amountSold ?? 0), 0)

    const receivedTry = filteredTransactions
      .filter((transaction) => transaction.type === 'SELL')
      .reduce((sum, transaction) => sum + transaction.amountReceived, 0)

    const currentUsdtBalance = filteredTransactions.reduce((sum, transaction) => {
      if (transaction.type === 'BUY') return sum + transaction.amountReceived
      if (transaction.type === 'SELL') return sum - (transaction.amountSold ?? 0)
      return sum + transaction.amountReceived - (transaction.amountSold ?? 0)
    }, 0)
    const averageSellPriceTry = soldUsdt > 0 ? receivedTry / soldUsdt : 0
    const tryProfit = calculateRealizedTryProfit(filteredTransactions)

    return {
      boughtUsdt,
      soldUsdt,
      receivedTry,
      currentUsdtBalance,
      averageSellPriceTry,
      tryProfit,
    }
  }, [filteredTransactions])

  const cycleSummaries = useMemo(() => {
    const totalsByCycle = new Map<string, { usdtIn: number; usdtOut: number; tradeCount: number }>()

    for (const cycleItem of cycleOptions) {
      totalsByCycle.set(cycleItem.name, {
        usdtIn: 0,
        usdtOut: 0,
        tradeCount: 0,
      })
    }

    for (const transaction of transactions) {
      const cycleName = transaction.cycle
      const current = totalsByCycle.get(cycleName) ?? {
        usdtIn: 0,
        usdtOut: 0,
        tradeCount: 0,
      }

      if (transaction.type === 'BUY') {
        current.usdtIn += transaction.amountReceived
      } else if (transaction.type === 'SELL') {
        current.usdtOut += transaction.amountSold ?? 0
      } else {
        current.usdtIn += transaction.amountReceived
        current.usdtOut += transaction.amountSold ?? 0
      }

      current.tradeCount += 1
      totalsByCycle.set(cycleName, current)
    }

    return Array.from(totalsByCycle.entries())
      .map(([cycleName, value]) => ({
        cycleName,
        ...value,
        createdAt:
          cycleOptions.find((cycleItem) => cycleItem.name === cycleName)?.createdAt ??
          new Date().toISOString(),
        profitTry: calculateRealizedTryProfit(
          transactions.filter((transaction) => transaction.cycle === cycleName)
        ),
      }))
      .sort((a, b) => b.profitTry - a.profitTry)
  }, [cycleOptions, transactions])

  useEffect(() => {
    if (!transactionCycle && cycleOptions.length > 0) {
      setTransactionCycle(cycleOptions[0].name)
      setCycleSearchTerm(cycleOptions[0].name)
    }
  }, [transactionCycle, cycleOptions])

  useEffect(() => {
    if (!selectedCycle) return
    setTransactionCycle(selectedCycle)
    setCycleSearchTerm(selectedCycle)
    setIsCycleComboboxOpen(false)
  }, [selectedCycle])

  useEffect(() => {
    if (!newInstitutionIcon) {
      setNewInstitutionIconPreviewUrl(null)
      return
    }
    const previewUrl = URL.createObjectURL(newInstitutionIcon)
    setNewInstitutionIconPreviewUrl(previewUrl)
    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [newInstitutionIcon])

  const filteredCycleOptions = useMemo(() => {
    const q = cycleSearchTerm.trim().toLowerCase()
    if (!q) return cycleOptions
    return cycleOptions.filter((cycleItem) => cycleItem.name.toLowerCase().includes(q))
  }, [cycleOptions, cycleSearchTerm])

  const institutionOptions = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const institution of institutions) {
      map.set(institution.name, institution.iconFileName)
    }
    for (const transaction of transactions) {
      if (transaction.senderInstitution && !map.has(transaction.senderInstitution)) {
        map.set(transaction.senderInstitution, null)
      }
      if (transaction.recipientInstitution && !map.has(transaction.recipientInstitution)) {
        map.set(transaction.recipientInstitution, null)
      }
    }
    return Array.from(map.entries())
      .map(([name, iconFileName]) => ({ name, iconFileName }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [institutions, transactions])

  const getInstitutionIconSrc = (iconFileName: string | null) =>
    iconFileName ? `/api/transactions/institutions/icon/${encodeURIComponent(iconFileName)}` : null

  const renderInstitutionCombobox = (
    role: 'sender' | 'recipient',
    value: string,
    onValueChange: (nextValue: string) => void,
    disabled = false
  ) => {
    const selected = institutionOptions.find(
      (option) => option.name.toLowerCase() === value.trim().toLowerCase()
    )

    return (
      <Combobox
        value={value}
        options={institutionOptions.map((option) => ({ value: option.name, label: option.name }))}
        placeholder="Select institution"
        emptyText="No institutions found"
        onValueChange={onValueChange}
        disabled={disabled}
        startAction={
          selected?.iconFileName ? (
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-sm">
              <Image
                src={getInstitutionIconSrc(selected.iconFileName) as string}
                alt={selected.name}
                width={16}
                height={16}
                unoptimized
                className="block h-full w-full object-cover"
              />
            </span>
          ) : undefined
        }
        endAction={
          <Button
            type="button"
            variant="icon"
            size="icon"
            className="h-7 w-7"
            onClick={() => openInstitutionDialog(role)}
            aria-label="Create institution"
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
        renderOption={(option) => {
          const match = institutionOptions.find((item) => item.name === option.value)
          return (
            <div className="flex items-center gap-2">
              {match?.iconFileName ? (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                  <Image
                    src={getInstitutionIconSrc(match.iconFileName) as string}
                    alt={option.value}
                    width={16}
                    height={16}
                    unoptimized
                    className="block h-full w-full object-cover"
                  />
                </span>
              ) : (
                <span className="bg-muted h-4 w-4 rounded-sm" aria-hidden />
              )}
              <span className="truncate">{option.label ?? option.value}</span>
            </div>
          )
        }}
      />
    )
  }

  const openInstitutionDialog = (target: 'sender' | 'recipient') => {
    setInstitutionTarget(target)
    setNewInstitutionName('')
    setNewInstitutionIcon(null)
    setIsInstitutionDialogOpen(true)
  }

  const createInstitution = async () => {
    const name = newInstitutionName.trim()
    if (!name) return
    setIsInstitutionSaving(true)
    try {
      const payload = {
        name,
        icon: newInstitutionIcon ?? undefined,
      }
      const { data, error } = await appApi.transactions.institutions.post(payload)
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Failed to create institution'
        throw new Error(message)
      }

      const created = data as Institution
      setInstitutions((prev) => {
        const withoutCurrent = prev.filter(
          (institutionItem) =>
            institutionItem.id !== created.id && institutionItem.name !== created.name
        )
        return [...withoutCurrent, created].sort((a, b) => a.name.localeCompare(b.name))
      })
      if (institutionTarget === 'sender') {
        setSenderInstitution(created.name)
      } else if (institutionTarget === 'recipient') {
        setRecipientInstitution(created.name)
      }
      setIsInstitutionDialogOpen(false)
      setNewInstitutionName('')
      setNewInstitutionIcon(null)
      setInstitutionTarget(null)
      appToast.success('Institution created')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create institution'
      appToast.fail(message)
    } finally {
      setIsInstitutionSaving(false)
    }
  }

  const nextCycleName = useMemo(
    () => getNextCycleName(cycleOptions.map((cycleItem) => cycleItem.name)),
    [cycleOptions]
  )

  return (
    <div className="relative h-screen w-full p-4 pt-16">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LogoutIconButton />
        <ThemeSwitcher />
      </div>

      <div className="mb-6 w-full">
        <AppTabs />
      </div>

      <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CycleToolbar
            selectedCycleName={selectedCycle ?? null}
            onRenameCycle={renameSelectedCycle}
            onDeleteCycle={async () => requestDeleteCycle()}
            onResetCycle={async () => requestResetCycle()}
            isRenaming={isCycleRenaming}
            isDeleting={isCycleDeleting}
            isResetting={isCycleResetting}
          />
          <div className="flex items-center gap-2">
            {selectedCycleItem && (
              <Button
                variant="outline"
                onClick={() => requestUndoLastTransaction()}
                disabled={isCycleUndoing}
              >
                <RotateCcw className="h-4 w-4" />
                {isCycleUndoing ? 'Undoing...' : 'Undo last transaction'}
              </Button>
            )}
            <Dialog
              open={isFormOpen}
              onOpenChange={(open) => {
                setIsFormOpen(open)
                if (!open) {
                  setErrorMessage(null)
                  setIsEditTransactionConfirmOpen(false)
                  resetForm()
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={() => {
                    setErrorMessage(null)
                    setIsEditTransactionConfirmOpen(false)
                    resetForm()
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create new transaction
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransactionId ? 'Edit transaction' : 'Create transaction'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTransactionId
                      ? 'Update the selected transaction.'
                      : 'Add a BUY or SELL trade entry.'}
                  </DialogDescription>
                </DialogHeader>
                {isSellBalanceWarningVisible && (
                  <Alert className="mt-2 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Balance warning</AlertTitle>
                    <AlertDescription>
                      Amount sold is higher than this cycle&apos;s available USDT balance.
                    </AlertDescription>
                  </Alert>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void createTransaction()
                  }}
                >
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
                          <SelectItem value="CYCLE_SETTLEMENT">Cycle Settlement</SelectItem>
                          <SelectItem value="DEPOSIT_BALANCE_CORRECTION">
                            Deposit Balance Correction
                          </SelectItem>
                          <SelectItem value="WITHDRAW_BALANCE_CORRECTION">
                            Withdraw Balance Correction
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p
                        className={
                          isCycleLockedBySelection
                            ? 'text-muted-foreground mb-2 text-sm font-semibold'
                            : 'mb-2 text-sm font-semibold'
                        }
                      >
                        {transactionType === 'CYCLE_SETTLEMENT' ? 'Source cycle' : 'Cycle'}
                      </p>
                      <div className="relative">
                        <Input
                          value={isCycleComboboxOpen ? cycleSearchTerm : transactionCycle}
                          onFocus={() => {
                            if (isCycleLockedBySelection) return
                            setCycleSearchTerm(transactionCycle)
                            setIsCycleComboboxOpen(true)
                          }}
                          onBlur={() => {
                            if (isCycleLockedBySelection) return
                            setTimeout(() => setIsCycleComboboxOpen(false), 120)
                          }}
                          onChange={(event) => {
                            if (isCycleLockedBySelection) return
                            setCycleSearchTerm(event.target.value)
                            setTransactionCycle('')
                          }}
                          placeholder="Search cycle..."
                          disabled={isCycleLockedBySelection}
                          readOnly={isCycleLockedBySelection}
                          endAction={
                            isCycleLockedBySelection ? null : (
                              <Button
                                type="button"
                                variant="icon"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setIsCycleComboboxOpen(false)
                                  setCycleErrorMessage(null)
                                  setNewCycleName(nextCycleName)
                                  setIsCycleDialogOpen(true)
                                }}
                                aria-label="Create new cycle"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )
                          }
                          rootClassname={
                            isCycleLockedBySelection
                              ? 'bg-muted/70 border-border cursor-not-allowed opacity-80'
                              : undefined
                          }
                          className={isCycleLockedBySelection ? 'text-muted-foreground' : undefined}
                        />
                        {isCycleComboboxOpen && !isCycleLockedBySelection && (
                          <div className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border p-1 shadow-md">
                            {filteredCycleOptions.length === 0 ? (
                              <p className="text-muted-foreground px-2 py-1.5 text-sm">
                                No cycles found
                              </p>
                            ) : (
                              filteredCycleOptions.map((cycleItem) => (
                                <button
                                  key={cycleItem.id}
                                  type="button"
                                  className="hover:bg-accent hover:text-accent-foreground w-full rounded px-2 py-1.5 text-left text-sm"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    setTransactionCycle(cycleItem.name)
                                    setCycleSearchTerm(cycleItem.name)
                                    setIsCycleComboboxOpen(false)
                                  }}
                                >
                                  {cycleItem.name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {transactionType === 'BUY' ? (
                      <>
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 md:col-span-2">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-muted-foreground text-xs font-semibold uppercase">
                              Buy Details
                            </p>
                            <ButtonWithTooltip
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-w-12 px-2 text-xs"
                              tooltipText={
                                buyInputMode === 'amount-received'
                                  ? 'Amt = Amount received mode'
                                  : 'PPU = Price per unit mode'
                              }
                              onClick={() => {
                                if (buyInputMode === 'amount-received') {
                                  setBuyInputMode('price-per-unit')
                                  setBuyAmountReceived('')
                                } else {
                                  setBuyInputMode('amount-received')
                                  setBuyPricePerUnit('')
                                }
                              }}
                            >
                              {buyInputMode === 'amount-received' ? 'Mode: Amt' : 'Mode: PPU'}
                            </ButtonWithTooltip>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                endAction={
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 min-w-9 px-2 text-xs"
                                    onClick={() =>
                                      setTransactionCurrency((prev) =>
                                        prev === 'USD' ? 'TRY' : 'USD'
                                      )
                                    }
                                  >
                                    {CURRENCY_SYMBOLS[transactionCurrency]}
                                  </Button>
                                }
                              />
                            </div>

                            <div>
                              <p className="mb-2 text-sm font-semibold">
                                {buyInputMode === 'amount-received'
                                  ? 'Amount received (USDT)'
                                  : 'Price per unit (TRY)'}
                              </p>
                              {buyInputMode === 'amount-received' ? (
                                <NumberInput
                                  value={buyAmountReceived}
                                  onChange={setBuyAmountReceived}
                                  startAction={
                                    <span className="text-muted-foreground text-sm">
                                      {CURRENCY_SYMBOLS.USDT}
                                    </span>
                                  }
                                />
                              ) : (
                                <NumberInput
                                  value={buyPricePerUnit}
                                  onChange={setBuyPricePerUnit}
                                  startAction={
                                    <span className="text-muted-foreground text-sm">
                                      {CURRENCY_SYMBOLS.TRY}
                                    </span>
                                  }
                                />
                              )}
                            </div>

                            {transactionCurrency === 'USD' && (
                              <div>
                                <p className="mb-2 text-sm font-semibold">USD/TRY rate at buy</p>
                                <NumberInput
                                  value={buyUsdTryRateAtBuy}
                                  onChange={setBuyUsdTryRateAtBuy}
                                  startAction={
                                    <span className="text-muted-foreground text-sm">
                                      {CURRENCY_SYMBOLS.TRY}
                                    </span>
                                  }
                                />
                              </div>
                            )}

                            <div>
                              <p className="mb-2 text-sm font-semibold">
                                Fee ({buyFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT})
                              </p>
                              <NumberInput
                                value={buyFee}
                                onChange={setBuyFee}
                                placeholder="0.00"
                                endAction={
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 min-w-9 px-2 text-xs"
                                    onClick={() =>
                                      setBuyFeeUnit((prev) =>
                                        prev === 'percent' ? 'usdt' : 'percent'
                                      )
                                    }
                                  >
                                    {buyFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT}
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Accordion type="single" collapsible className="rounded-lg border px-3">
                            <AccordionItem value="buy-party-info" className="border-b-0">
                              <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                                Sender & recipient information
                              </AccordionTrigger>
                              <AccordionContent className="pt-1">
                                <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                                  <input
                                    type="checkbox"
                                    checked={payingWithCash}
                                    onChange={(event) => {
                                      const checked = event.target.checked
                                      setPayingWithCash(checked)
                                      if (checked) {
                                        setSenderInstitution('')
                                        setSenderIban('')
                                        setSenderName('')
                                        setRecipientInstitution('')
                                        setRecipientIban('')
                                        setRecipientName('')
                                      }
                                    }}
                                  />
                                  Paying with cash
                                </label>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                                    <p className="mb-3 text-sm font-semibold">Sender information</p>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Institution</p>
                                        {renderInstitutionCombobox(
                                          'sender',
                                          senderInstitution,
                                          setSenderInstitution,
                                          payingWithCash
                                        )}
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">IBAN</p>
                                        <Input
                                          value={senderIban}
                                          onChange={(event) => setSenderIban(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Name</p>
                                        <Input
                                          value={senderName}
                                          onChange={(event) => setSenderName(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                                    <p className="mb-3 text-sm font-semibold">
                                      Recipient information
                                    </p>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Institution</p>
                                        {renderInstitutionCombobox(
                                          'recipient',
                                          recipientInstitution,
                                          setRecipientInstitution,
                                          payingWithCash
                                        )}
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">IBAN</p>
                                        <Input
                                          value={recipientIban}
                                          onChange={(event) => setRecipientIban(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Name</p>
                                        <Input
                                          value={recipientName}
                                          onChange={(event) => setRecipientName(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold">Datetime</p>
                          <Input
                            type="datetime-local"
                            value={occurredAt}
                            onChange={(event) => setOccurredAt(event.target.value)}
                          />
                        </div>
                      </>
                    ) : transactionType === 'SELL' ? (
                      <>
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 md:col-span-2">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-muted-foreground text-xs font-semibold uppercase">
                              Sell Details
                            </p>
                            <ButtonWithTooltip
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-w-12 px-2 text-xs"
                              tooltipText={
                                sellInputMode === 'amount-received'
                                  ? 'Amount received mode'
                                  : 'Price per unit mode'
                              }
                              onClick={() => {
                                if (sellInputMode === 'amount-received') {
                                  setSellInputMode('price-per-unit')
                                  setSellAmountReceived('')
                                } else {
                                  setSellInputMode('amount-received')
                                  setSellPricePerUnit('')
                                }
                              }}
                            >
                              {sellInputMode === 'amount-received' ? 'Mode: Amt' : 'Mode: PPU'}
                            </ButtonWithTooltip>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-2 text-sm font-semibold">Amount sold (USDT)</p>
                              <NumberInput
                                value={sellAmountSold}
                                onChange={setSellAmountSold}
                                startAction={
                                  <span className="text-muted-foreground text-sm">
                                    {CURRENCY_SYMBOLS.USDT}
                                  </span>
                                }
                                endAction={
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                                    onClick={() => {
                                      const maxValue = availableCycleUsdtBalance
                                        .toFixed(4)
                                        .replace(/\.?0+$/, '')
                                      setSellAmountSold(maxValue)
                                    }}
                                  >
                                    MAX
                                  </button>
                                }
                              />
                              <p className="text-muted-foreground mt-1 text-xs">
                                Available USDT balance: {formatUsdt(availableCycleUsdtBalance)} USDT
                              </p>
                            </div>

                            <div>
                              <p className="mb-2 text-sm font-semibold">
                                {sellInputMode === 'amount-received'
                                  ? 'Amount received (TRY)'
                                  : 'Price per unit (TRY)'}
                              </p>
                              {sellInputMode === 'amount-received' ? (
                                <NumberInput
                                  value={sellAmountReceived}
                                  onChange={setSellAmountReceived}
                                  startAction={
                                    <span className="text-muted-foreground text-sm">
                                      {CURRENCY_SYMBOLS.TRY}
                                    </span>
                                  }
                                />
                              ) : (
                                <NumberInput
                                  value={sellPricePerUnit}
                                  onChange={setSellPricePerUnit}
                                  startAction={
                                    <span className="text-muted-foreground text-sm">
                                      {CURRENCY_SYMBOLS.TRY}
                                    </span>
                                  }
                                />
                              )}
                            </div>

                            <div>
                              <p className="mb-2 text-sm font-semibold">
                                Fee ({sellFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT})
                              </p>
                              <NumberInput
                                value={sellFee}
                                onChange={setSellFee}
                                placeholder="0.00"
                                endAction={
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 min-w-9 px-2 text-xs"
                                    onClick={() =>
                                      setSellFeeUnit((prev) =>
                                        prev === 'percent' ? 'usdt' : 'percent'
                                      )
                                    }
                                  >
                                    {sellFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT}
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Accordion type="single" collapsible className="rounded-lg border px-3">
                            <AccordionItem value="sell-party-info" className="border-b-0">
                              <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                                Sender & recipient information
                              </AccordionTrigger>
                              <AccordionContent className="pt-1">
                                <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                                  <input
                                    type="checkbox"
                                    checked={payingWithCash}
                                    onChange={(event) => {
                                      const checked = event.target.checked
                                      setPayingWithCash(checked)
                                      if (checked) {
                                        setSenderInstitution('')
                                        setSenderIban('')
                                        setSenderName('')
                                        setRecipientInstitution('')
                                        setRecipientIban('')
                                        setRecipientName('')
                                      }
                                    }}
                                  />
                                  Paying with cash
                                </label>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                                    <p className="mb-3 text-sm font-semibold">Sender information</p>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Institution</p>
                                        {renderInstitutionCombobox(
                                          'sender',
                                          senderInstitution,
                                          setSenderInstitution,
                                          payingWithCash
                                        )}
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">IBAN</p>
                                        <Input
                                          value={senderIban}
                                          onChange={(event) => setSenderIban(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Name</p>
                                        <Input
                                          value={senderName}
                                          onChange={(event) => setSenderName(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                                    <p className="mb-3 text-sm font-semibold">
                                      Recipient information
                                    </p>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Institution</p>
                                        {renderInstitutionCombobox(
                                          'recipient',
                                          recipientInstitution,
                                          setRecipientInstitution,
                                          payingWithCash
                                        )}
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">IBAN</p>
                                        <Input
                                          value={recipientIban}
                                          onChange={(event) => setRecipientIban(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                      <div>
                                        <p className="mb-2 text-xs font-semibold">Name</p>
                                        <Input
                                          value={recipientName}
                                          onChange={(event) => setRecipientName(event.target.value)}
                                          placeholder="Optional"
                                          disabled={payingWithCash}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold">Datetime</p>
                          <Input
                            type="datetime-local"
                            value={occurredAt}
                            onChange={(event) => setOccurredAt(event.target.value)}
                          />
                        </div>
                      </>
                    ) : transactionType === 'CYCLE_SETTLEMENT' ? (
                      <>
                        <div>
                          <p className="mb-2 text-sm font-semibold">Destination cycle</p>
                          <Select value={settlementToCycle} onValueChange={setSettlementToCycle}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination cycle" />
                            </SelectTrigger>
                            <SelectContent>
                              {cycleOptions
                                .filter((cycleItem) => cycleItem.name !== getEffectiveCycle())
                                .map((cycleItem) => (
                                  <SelectItem key={cycleItem.id} value={cycleItem.name}>
                                    {cycleItem.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold">Settlement amount (USDT)</p>
                          <NumberInput
                            value={settlementAmount}
                            onChange={setSettlementAmount}
                            startAction={
                              <span className="text-muted-foreground text-sm">
                                {CURRENCY_SYMBOLS.USDT}
                              </span>
                            }
                            endAction={
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                                onClick={() => {
                                  const maxValue = availableCycleUsdtBalance
                                    .toFixed(4)
                                    .replace(/\.?0+$/, '')
                                  setSettlementAmount(maxValue)
                                }}
                              >
                                MAX
                              </button>
                            }
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Source cycle balance: {formatUsdt(availableCycleUsdtBalance)} USDT
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="mb-2 text-sm font-semibold">Description (optional)</p>
                          <Textarea
                            value={settlementDescription}
                            onChange={(event) => setSettlementDescription(event.target.value)}
                            placeholder="Add transfer notes"
                            rows={3}
                          />
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold">Datetime</p>
                          <Input
                            type="datetime-local"
                            value={occurredAt}
                            onChange={(event) => setOccurredAt(event.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="mb-2 text-sm font-semibold">Correction amount (USDT)</p>
                          <NumberInput
                            value={correctionAmount}
                            onChange={setCorrectionAmount}
                            startAction={
                              <span className="text-muted-foreground text-sm">
                                {CURRENCY_SYMBOLS.USDT}
                              </span>
                            }
                            endAction={
                              transactionType === 'WITHDRAW_BALANCE_CORRECTION' ? (
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                                  onClick={() => {
                                    const maxValue = availableCycleUsdtBalance
                                      .toFixed(4)
                                      .replace(/\.?0+$/, '')
                                    setCorrectionAmount(maxValue)
                                  }}
                                >
                                  MAX
                                </button>
                              ) : undefined
                            }
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Cycle balance: {formatUsdt(availableCycleUsdtBalance)} USDT
                          </p>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold">Datetime</p>
                          <Input
                            type="datetime-local"
                            value={occurredAt}
                            onChange={(event) => setOccurredAt(event.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                        setErrorMessage(null)
                      }}
                      disabled={isSaving || isTransactionUpdating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving || isTransactionUpdating}>
                      {isSaving
                        ? 'Creating...'
                        : isTransactionUpdating
                          ? 'Saving...'
                          : editingTransactionId
                            ? 'Save changes'
                            : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Dialog
          open={isInstitutionDialogOpen}
          onOpenChange={(open) => {
            setIsInstitutionDialogOpen(open)
            if (!open) {
              setNewInstitutionName('')
              setNewInstitutionIcon(null)
              setNewInstitutionIconPreviewUrl(null)
              setInstitutionTarget(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create institution</DialogTitle>
              <DialogDescription>Add a new institution name to use in this form.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Institution</p>
              <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
                <input
                  ref={institutionIconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setNewInstitutionIcon(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="bg-muted hover:bg-muted/70 flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-md border"
                  onClick={() => institutionIconInputRef.current?.click()}
                  aria-label="Upload institution icon"
                >
                  {newInstitutionIconPreviewUrl ? (
                    <Image
                      src={newInstitutionIconPreviewUrl}
                      alt="Institution icon preview"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Plus className="text-muted-foreground h-5 w-5" />
                  )}
                </button>
                <Input
                  value={newInstitutionName}
                  onChange={(event) => setNewInstitutionName(event.target.value)}
                  placeholder="Institution name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInstitutionDialogOpen(false)
                  setNewInstitutionName('')
                  setNewInstitutionIcon(null)
                  setNewInstitutionIconPreviewUrl(null)
                  setInstitutionTarget(null)
                }}
                disabled={isInstitutionSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void createInstitution()}
                disabled={!newInstitutionName.trim() || isInstitutionSaving}
              >
                {isInstitutionSaving ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {cycleToolbarError && <p className="mt-2 text-sm text-red-600">{cycleToolbarError}</p>}
        <Dialog
          open={pendingCycleAction !== null}
          onOpenChange={(open) => {
            if (!open) setPendingCycleAction(null)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{cycleConfirmTitle}</DialogTitle>
              <DialogDescription>{cycleConfirmDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingCycleAction(null)}
                disabled={isCycleConfirmActionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={pendingCycleAction === 'delete-cycle' ? 'destructive' : 'default'}
                onClick={() => void executePendingCycleAction()}
                disabled={isCycleConfirmActionLoading}
              >
                {isCycleConfirmActionLoading ? 'Working...' : cycleConfirmActionLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div
              className={
                stats.currentUsdtBalance >= 0
                  ? 'rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4'
                  : 'rounded-lg border border-red-500/50 bg-red-500/10 p-4'
              }
            >
              <p
                className={
                  stats.currentUsdtBalance >= 0
                    ? 'flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300'
                    : 'flex items-center gap-1 text-sm font-semibold text-red-700 dark:text-red-300'
                }
              >
                Current USDT
                <Image src={usdtIcon} alt="USDT" width={14} height={14} />
                balance
              </p>
              <p
                className={
                  stats.currentUsdtBalance >= 0
                    ? 'mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300'
                    : 'mt-2 text-3xl font-bold text-red-700 dark:text-red-300'
                }
              >
                {formatUsdt(stats.currentUsdtBalance)}
              </p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-semibold uppercase">
                Total bought
                <Image src={usdtIcon} alt="USDT" width={14} height={14} />
              </p>
              <p className="mt-1 text-xl font-bold">{formatUsdt(stats.boughtUsdt)} USDT</p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-semibold uppercase">
                Total sold
                <Image src={usdtIcon} alt="USDT" width={14} height={14} />
              </p>
              <p className="mt-1 text-xl font-bold">{formatUsdt(stats.soldUsdt)} USDT</p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">TRY received</p>
              <p className="mt-1 text-xl font-bold">₺{formatTry(stats.receivedTry)}</p>
            </div>

            <div
              className={
                stats.tryProfit >= 0
                  ? 'rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4'
                  : 'rounded-lg border border-red-500/50 bg-red-500/10 p-4'
              }
            >
              <p
                className={
                  stats.tryProfit >= 0
                    ? 'text-xs font-semibold text-emerald-700 uppercase dark:text-emerald-300'
                    : 'text-xs font-semibold text-red-700 uppercase dark:text-red-300'
                }
              >
                TRY profit
              </p>
              <p
                className={
                  stats.tryProfit >= 0
                    ? 'mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300'
                    : 'mt-1 text-xl font-bold text-red-700 dark:text-red-300'
                }
              >
                {stats.tryProfit >= 0 ? '+' : '-'}₺{formatTry(Math.abs(stats.tryProfit))}
              </p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Avg sell price
              </p>
              <p className="mt-1 text-xl font-bold">₺{formatTry(stats.averageSellPriceTry)}</p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Profit by cycle
                </p>
                <Dialog
                  open={isCycleDialogOpen}
                  onOpenChange={(open) => {
                    setIsCycleDialogOpen(open)
                    if (open) {
                      setCycleErrorMessage(null)
                      setNewCycleName(nextCycleName)
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                      New Cycle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create cycle</DialogTitle>
                      <DialogDescription>Group multiple trades under one cycle.</DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        void createCycle()
                      }}
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Cycle name</p>
                        <Input
                          value={newCycleName}
                          onChange={(event) => setNewCycleName(event.target.value)}
                          placeholder={nextCycleName}
                        />
                        {cycleErrorMessage && (
                          <p className="text-sm text-red-600">{cycleErrorMessage}</p>
                        )}
                      </div>
                      <DialogFooter className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCycleDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCycleSaving}>
                          {isCycleSaving ? 'Creating...' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {cycleSummaries.length === 0 ? (
                <button
                  type="button"
                  className={
                    selectedCycle
                      ? 'hover:bg-selected/60 flex w-full cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 text-left'
                      : 'bg-selected text-selected-foreground hover:bg-selected/90 flex w-full cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 text-left'
                  }
                  onClick={() => void setSelectedCycle(null)}
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      All
                      {!selectedCycle && (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                      )}
                    </p>
                    <p className="text-muted-foreground text-[11px]">No cycles yet</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    className={
                      selectedCycle
                        ? 'hover:bg-selected/60 flex w-full cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 text-left'
                        : 'bg-selected text-selected-foreground hover:bg-selected/90 flex w-full cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 text-left'
                    }
                    onClick={() => void setSelectedCycle(null)}
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        All
                        {!selectedCycle && (
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                        )}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {transactions.length} trades total
                      </p>
                    </div>
                  </button>
                  {cycleSummaries.map((item) => (
                    <div
                      key={item.cycleName}
                      className={
                        selectedCycle === item.cycleName
                          ? 'bg-selected text-selected-foreground hover:bg-selected/90 flex cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 last:border-b-0'
                          : 'hover:bg-selected/60 flex cursor-pointer items-center justify-between rounded-md border-b border-[hsl(var(--border))] p-3 last:border-b-0'
                      }
                      onClick={() => void setSelectedCycle(item.cycleName)}
                    >
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          {item.cycleName}
                          {selectedCycle === item.cycleName && (
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                          )}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {formatDateOnly(item.createdAt)} | {item.tradeCount} trades
                        </p>
                      </div>
                      <p
                        className={
                          item.profitTry >= 0
                            ? 'text-sm font-bold text-emerald-700 dark:text-emerald-300'
                            : 'text-sm font-bold text-red-700 dark:text-red-300'
                        }
                      >
                        {item.profitTry >= 0 ? '+' : '-'}₺{formatTry(Math.abs(item.profitTry))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading transactions...</p>
            ) : (
              <>
                <TradebookTransactionsTable
                  rows={ledgerRows}
                  initialRows={10}
                  showCycleColumn={!selectedCycle}
                  onRowClick={setSelectedTransactionId}
                />
                <TradebookCharts transactions={filteredTransactions} />
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={selectedTransaction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransactionId(null)
            setIsDeleteTransactionConfirmOpen(false)
            setIsEditTransactionConfirmOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction details</DialogTitle>
            <DialogDescription>Full information for the selected transaction.</DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p>
                <span className="font-semibold">ID:</span> {selectedTransaction.id}
              </p>
              <p>
                <span className="font-semibold">Cycle:</span> {selectedTransaction.cycle}
              </p>
              <p>
                <span className="font-semibold">Type:</span> {selectedTransaction.type}
              </p>
              <p>
                <span className="font-semibold">Occurred at:</span>{' '}
                {new Date(selectedTransaction.occurredAt).toLocaleString('en-US')}
              </p>
              <p>
                <span className="font-semibold">Created at:</span>{' '}
                {new Date(selectedTransaction.createdAt).toLocaleString('en-US')}
              </p>
              <p>
                <span className="font-semibold">Updated at:</span>{' '}
                {new Date(selectedTransaction.updatedAt).toLocaleString('en-US')}
              </p>
              <p>
                <span className="font-semibold">Transaction value:</span>{' '}
                {selectedTransaction.transactionValue === null
                  ? '-'
                  : formatAmount(selectedTransaction.transactionValue)}
              </p>
              <p>
                <span className="font-semibold">Transaction currency:</span>{' '}
                {selectedTransaction.transactionCurrency ?? '-'}
              </p>
              <p>
                <span className="font-semibold">USD/TRY rate at buy:</span>{' '}
                {selectedTransaction.usdTryRateAtBuy === null
                  ? '-'
                  : formatAmount(selectedTransaction.usdTryRateAtBuy)}
              </p>
              <p>
                <span className="font-semibold">Amount received:</span>{' '}
                {formatAmount(selectedTransaction.amountReceived)}
              </p>
              <p>
                <span className="font-semibold">Amount sold:</span>{' '}
                {selectedTransaction.amountSold === null
                  ? '-'
                  : formatAmount(selectedTransaction.amountSold)}
              </p>
              <p>
                <span className="font-semibold">Price per unit:</span>{' '}
                {selectedTransaction.pricePerUnit === null
                  ? '-'
                  : formatAmount(selectedTransaction.pricePerUnit)}
              </p>
              <p>
                <span className="font-semibold">Received currency:</span>{' '}
                {selectedTransaction.receivedCurrency}
              </p>
              <p>
                <span className="font-semibold">Commission percent:</span>{' '}
                {selectedTransaction.commissionPercent === null
                  ? '-'
                  : `${formatAmount(selectedTransaction.commissionPercent)}%`}
              </p>
              <p>
                <span className="font-semibold">Effective rate TRY:</span>{' '}
                {selectedTransaction.effectiveRateTry === null
                  ? '-'
                  : formatAmount(selectedTransaction.effectiveRateTry)}
              </p>
              <p>
                <span className="font-semibold">Description:</span>{' '}
                {selectedTransaction.description ?? '-'}
              </p>
              <p>
                <span className="font-semibold">Sender institution:</span>{' '}
                {selectedTransaction.senderInstitution ?? '-'}
              </p>
              <p>
                <span className="font-semibold">Sender IBAN:</span>{' '}
                {selectedTransaction.senderIban ?? '-'}
              </p>
              <p>
                <span className="font-semibold">Sender name:</span>{' '}
                {selectedTransaction.senderName ?? '-'}
              </p>
              <p>
                <span className="font-semibold">Recipient institution:</span>{' '}
                {selectedTransaction.recipientInstitution ?? '-'}
              </p>
              <p>
                <span className="font-semibold">Recipient IBAN:</span>{' '}
                {selectedTransaction.recipientIban ?? '-'}
              </p>
              <p>
                <span className="font-semibold">Recipient name:</span>{' '}
                {selectedTransaction.recipientName ?? '-'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedTransactionId(null)}>
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                selectedTransaction ? openEditTransactionForm(selectedTransaction) : undefined
              }
              disabled={!selectedTransaction || selectedTransaction.type === 'CYCLE_SETTLEMENT'}
            >
              Edit transaction
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void requestDeleteSelectedTransaction()}
              disabled={isTransactionDeleting}
            >
              {isTransactionDeleting ? 'Deleting...' : 'Delete transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTransactionConfirmOpen} onOpenChange={setIsEditTransactionConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save edit?</DialogTitle>
            <DialogDescription>
              This is not the latest transaction in its cycle. Editing it may change downstream
              balances and profit calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditTransactionConfirmOpen(false)}
              disabled={isTransactionUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void createTransaction(true)}
              disabled={isTransactionUpdating}
            >
              {isTransactionUpdating ? 'Saving...' : 'Save anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteTransactionConfirmOpen}
        onOpenChange={setIsDeleteTransactionConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogDescription>
              This is not the latest transaction in cycle &quot;
              {selectedTransaction?.cycle ?? ''}
              &quot;. Deleting it may change downstream balances and profit calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteTransactionConfirmOpen(false)}
              disabled={isTransactionDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                selectedTransaction
                  ? void executeDeleteTransaction(selectedTransaction.id)
                  : undefined
              }
              disabled={isTransactionDeleting || !selectedTransaction}
            >
              {isTransactionDeleting ? 'Deleting...' : 'Delete anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TradebookPage
