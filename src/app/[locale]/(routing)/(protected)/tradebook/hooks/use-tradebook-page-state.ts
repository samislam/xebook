'use client'

import { appToast } from '@/lib/toast'
import { appApi } from '@/lib/elysia/eden'
import { CURRENCY_SYMBOLS } from '@/constants'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateRealizedTryProfit } from '../tradebook.utils'
import { useCycleActionDialogStore } from './use-cycle-action-dialog'
import { useCreateCycleDialogStore } from './use-create-cycle-dialog'
import type { CreateCycleFormValues } from '../schemas/create-cycle.schema'
import { SellFeeUnit, SellInputMode, TradeCycle } from '../tradebook.types'
import { formatTry, formatUsdt, getNextCycleName } from '../tradebook.utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BuyFeeUnit, BuyInputMode, Institution } from '../tradebook.types'
import { useCreateInstitutionDialogStore } from './use-create-institution-dialog'
import { useCreateTransactionDialogStore } from './use-create-transaction-dialog'
import { useUpdateTransactionDialogStore } from './use-update-transaction-dialog'
import { useTransactionDetailsDialogStore } from './use-transaction-details-dialog'
import { nowDateTimeLocal, toDateTimeLocal, toInputNumber } from '../tradebook.utils'
import type { TradebookTransactionFormValues } from '../schemas/transaction-form.schema'
import { TradeTransaction, TransactionCurrency, TransactionType } from '../tradebook.types'
import { useDeleteTransactionConfirmationDialogStore } from './use-delete-transaction-confirmation-dialog'

const transactionsQueryKey = ['tradebook', 'transactions'] as const
const cyclesQueryKey = ['tradebook', 'cycles'] as const
const institutionsQueryKey = ['tradebook', 'institutions'] as const

const getApiErrorMessage = (error: { value?: unknown } | null, fallback: string) =>
  (error?.value as { error?: string } | null)?.error ?? fallback

export const useTradebookPageState = () => {
  const queryClient = useQueryClient()
  const isCreateTransactionDialogOpen = useCreateTransactionDialogStore((state) => state.isOpen)
  const openCreateTransactionDialog = useCreateTransactionDialogStore((state) => state.open)
  const closeCreateTransactionDialog = useCreateTransactionDialogStore((state) => state.close)

  const isUpdateTransactionDialogOpen = useUpdateTransactionDialogStore((state) => state.isOpen)
  const updateTransactionDialogOpenedItem = useUpdateTransactionDialogStore(
    (state) => state.openedItem
  )
  const openUpdateTransactionDialog = useUpdateTransactionDialogStore((state) => state.open)
  const closeUpdateTransactionDialog = useUpdateTransactionDialogStore((state) => state.close)

  const isCreateCycleDialogOpen = useCreateCycleDialogStore((state) => state.isOpen)
  const openCreateCycleDialog = useCreateCycleDialogStore((state) => state.open)
  const closeCreateCycleDialog = useCreateCycleDialogStore((state) => state.close)

  const isCreateInstitutionDialogOpen = useCreateInstitutionDialogStore((state) => state.isOpen)
  const createInstitutionDialogOpenedItem = useCreateInstitutionDialogStore(
    (state) => state.openedItem
  )
  const openCreateInstitutionDialog = useCreateInstitutionDialogStore((state) => state.open)
  const closeCreateInstitutionDialog = useCreateInstitutionDialogStore((state) => state.close)

  const isTransactionDetailsDialogOpen = useTransactionDetailsDialogStore((state) => state.isOpen)
  const transactionDetailsDialogOpenedItem = useTransactionDetailsDialogStore(
    (state) => state.openedItem
  )
  const openTransactionDetailsDialog = useTransactionDetailsDialogStore((state) => state.open)
  const closeTransactionDetailsDialog = useTransactionDetailsDialogStore((state) => state.close)

  const isDeleteTransactionConfirmationDialogOpen = useDeleteTransactionConfirmationDialogStore(
    (state) => state.isOpen
  )
  const deleteTransactionConfirmationDialogOpenedItem = useDeleteTransactionConfirmationDialogStore(
    (state) => state.openedItem
  )
  const openDeleteTransactionConfirmationDialog = useDeleteTransactionConfirmationDialogStore(
    (state) => state.open
  )
  const closeDeleteTransactionConfirmationDialog = useDeleteTransactionConfirmationDialogStore(
    (state) => state.close
  )

  const isCycleActionDialogOpen = useCycleActionDialogStore((state) => state.isOpen)
  const cycleActionDialogOpenedItem = useCycleActionDialogStore((state) => state.openedItem)

  const openCycleActionDialog = useCycleActionDialogStore((state) => state.open)
  const closeCycleActionDialog = useCycleActionDialogStore((state) => state.close)

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
  const [transactionDescription, setTransactionDescription] = useState('')
  const [correctionAmount, setCorrectionAmount] = useState('')
  const [senderInstitution, setSenderInstitution] = useState('')
  const [senderIban, setSenderIban] = useState('')
  const [senderName, setSenderName] = useState('')
  const [recipientInstitution, setRecipientInstitution] = useState('')
  const [recipientIban, setRecipientIban] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [payingWithCash, setPayingWithCash] = useState(false)
  const [newInstitutionName, setNewInstitutionName] = useState('')
  const [newInstitutionIcon, setNewInstitutionIcon] = useState<File | null>(null)
  const [newInstitutionIconPreviewUrl, setNewInstitutionIconPreviewUrl] = useState<string | null>(
    null
  )
  const institutionIconInputRef = useRef<HTMLInputElement | null>(null)
  const isCycleLockedBySelection = Boolean(selectedCycle)

  const transactionsQuery = useQuery({
    queryKey: transactionsQueryKey,
    queryFn: async () => {
      const { data, error } = await appApi.transactions.get()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to load transactions'))
      }
      return data as TradeTransaction[]
    },
  })

  const cyclesQuery = useQuery({
    queryKey: cyclesQueryKey,
    queryFn: async () => {
      const { data, error } = await appApi.transactions.cycles.get()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to load cycles'))
      }
      return [...(data as TradeCycle[])].sort((a, b) => a.name.localeCompare(b.name))
    },
  })

  const institutionsQuery = useQuery({
    queryKey: institutionsQueryKey,
    queryFn: async () => {
      const { data, error } = await appApi.transactions.institutions.get()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to load institutions'))
      }
      return [...(data as Institution[])].sort((a, b) => a.name.localeCompare(b.name))
    },
  })

  const transactions = transactionsQuery.data ?? []
  const institutions = institutionsQuery.data ?? []
  const cycles = cyclesQuery.data ?? []
  const isLoading =
    transactionsQuery.isLoading || cyclesQuery.isLoading || institutionsQuery.isLoading

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

  const transactionFormValues: TradebookTransactionFormValues = {
    transactionType,
    transactionCycle,
    transactionCurrency,
    occurredAt,
    transactionValue,
    buyInputMode,
    buyAmountReceived,
    buyPricePerUnit,
    buyUsdTryRateAtBuy,
    buyFee,
    buyFeeUnit,
    sellAmountSold,
    sellAmountReceived,
    sellPricePerUnit,
    sellFee,
    sellFeeUnit,
    sellInputMode,
    settlementToCycle,
    settlementAmount,
    transactionDescription,
    correctionAmount,
    senderInstitution,
    senderIban,
    senderName,
    recipientInstitution,
    recipientIban,
    recipientName,
    payingWithCash,
  }

  const syncTransactionFormValues = (nextValues: TradebookTransactionFormValues) => {
    setTransactionType(nextValues.transactionType)
    setTransactionCycle(nextValues.transactionCycle)
    setTransactionCurrency(nextValues.transactionCurrency)
    setOccurredAt(nextValues.occurredAt)
    setTransactionValue(nextValues.transactionValue)
    setBuyInputMode(nextValues.buyInputMode)
    setBuyAmountReceived(nextValues.buyAmountReceived)
    setBuyPricePerUnit(nextValues.buyPricePerUnit)
    setBuyUsdTryRateAtBuy(nextValues.buyUsdTryRateAtBuy)
    setBuyFee(nextValues.buyFee)
    setBuyFeeUnit(nextValues.buyFeeUnit)
    setSellAmountSold(nextValues.sellAmountSold)
    setSellAmountReceived(nextValues.sellAmountReceived)
    setSellPricePerUnit(nextValues.sellPricePerUnit)
    setSellFee(nextValues.sellFee)
    setSellFeeUnit(nextValues.sellFeeUnit)
    setSellInputMode(nextValues.sellInputMode)
    setSettlementToCycle(nextValues.settlementToCycle)
    setSettlementAmount(nextValues.settlementAmount)
    setTransactionDescription(nextValues.transactionDescription)
    setCorrectionAmount(nextValues.correctionAmount)
    setSenderInstitution(nextValues.senderInstitution)
    setSenderIban(nextValues.senderIban)
    setSenderName(nextValues.senderName)
    setRecipientInstitution(nextValues.recipientInstitution)
    setRecipientIban(nextValues.recipientIban)
    setRecipientName(nextValues.recipientName)
    setPayingWithCash(nextValues.payingWithCash)
  }

  const resetForm = () => {
    closeUpdateTransactionDialog()
    closeCreateTransactionDialog()
    setTransactionType('BUY')
    const defaultCycle = selectedCycle ?? cycleOptions[0]?.name ?? ''
    setTransactionCycle(defaultCycle)
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
    setTransactionDescription('')
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
    closeCreateInstitutionDialog()
  }

  const createCycleMutation = useMutation({
    mutationFn: async (values: CreateCycleFormValues) => {
      const name = values.name.trim()
      const { data, error } = await appApi.transactions.cycles.post({ name })
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to create cycle'))
      }
      return data as TradeCycle
    },
    onSuccess: (created) => {
      queryClient.setQueryData<TradeCycle[]>(cyclesQueryKey, (prev = []) => {
        const exists = prev.some((cycleItem) => cycleItem.name === created.name)
        if (exists) return prev
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      })
      setTransactionCycle(created.name)
      closeCreateCycleDialog()
      appToast.success('Cycle created')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create cycle'
      setCycleErrorMessage(message)
      appToast.fail(message)
    },
  })

  const renameCycleMutation = useMutation({
    mutationFn: async ({ cycleId, name }: { cycleId: string; name: string }) => {
      const { data, error } = await appApi.transactions.cycles({ id: cycleId }).patch({ name })
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to rename cycle'))
      }
      return data as TradeCycle
    },
  })

  const deleteCycleMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const { error } = await appApi.transactions.cycles({ id: cycleId }).delete()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to delete cycle'))
      }
    },
  })

  const undoLastTransactionMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const { error } = await appApi.transactions.cycles({ id: cycleId }).undoLast.post()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to undo last transaction'))
      }
    },
  })

  const resetCycleMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const { error } = await appApi.transactions.cycles({ id: cycleId }).reset.post()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to reset cycle'))
      }
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await appApi.transactions({ id: transactionId }).delete()
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to delete transaction'))
      }
      return transactionId
    },
  })

  const createInstitutionMutation = useMutation({
    mutationFn: async ({ name, icon }: { name: string; icon?: File }) => {
      const { data, error } = await appApi.transactions.institutions.post({ name, icon })
      if (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to create institution'))
      }
      return data as Institution
    },
  })

  const isCycleSaving = createCycleMutation.isPending
  const isInstitutionSaving = createInstitutionMutation.isPending
  const isCycleRenaming = renameCycleMutation.isPending
  const isCycleUndoing = undoLastTransactionMutation.isPending
  const isCycleDeleting = deleteCycleMutation.isPending
  const isCycleResetting = resetCycleMutation.isPending
  const isTransactionDeleting = deleteTransactionMutation.isPending

  const createCycle = async (values: CreateCycleFormValues) => {
    setCycleErrorMessage(null)
    await createCycleMutation.mutateAsync(values)
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

    try {
      const updated = await renameCycleMutation.mutateAsync({
        cycleId: selectedCycleItem.id,
        name,
      })
      setSelectedCycle(updated.name)
      setTransactionCycle((prev) => (prev === selectedCycleItem.name ? updated.name : prev))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
        queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
      ])
      appToast.success('Cycle renamed')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename cycle'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    }
  }

  const deleteSelectedCycle = async () => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)

    try {
      await deleteCycleMutation.mutateAsync(selectedCycleItem.id)
      setSelectedCycle(null)
      if (transactionCycle === selectedCycleItem.name) {
        setTransactionCycle('')
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
        queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
      ])
      appToast.success('Cycle deleted')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete cycle'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    }
  }

  const undoLastTransactionInSelectedCycle = async () => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)

    try {
      await undoLastTransactionMutation.mutateAsync(selectedCycleItem.id)
      await queryClient.invalidateQueries({ queryKey: transactionsQueryKey })
      appToast.success('Last transaction undone')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to undo last transaction'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    }
  }

  const resetSelectedCycle = async () => {
    if (!selectedCycleItem) return false

    setCycleToolbarError(null)

    try {
      await resetCycleMutation.mutateAsync(selectedCycleItem.id)
      await queryClient.invalidateQueries({ queryKey: transactionsQueryKey })
      appToast.success('Cycle reset')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset cycle'
      setCycleToolbarError(message)
      appToast.fail(message)
      return false
    }
  }

  const requestUndoLastTransaction = () => {
    if (!selectedCycleItem) return
    openCycleActionDialog('undo-last')
  }

  const requestResetCycle = () => {
    if (!selectedCycleItem) return
    openCycleActionDialog('reset-cycle')
  }

  const requestDeleteCycle = () => {
    if (!selectedCycleItem) return
    openCycleActionDialog('delete-cycle')
  }

  const executePendingCycleAction = async () => {
    if (!cycleActionDialogOpenedItem) return

    let success = false
    if (cycleActionDialogOpenedItem === 'undo-last') {
      success = await undoLastTransactionInSelectedCycle()
    } else if (cycleActionDialogOpenedItem === 'reset-cycle') {
      success = await resetSelectedCycle()
    } else if (cycleActionDialogOpenedItem === 'delete-cycle') {
      success = await deleteSelectedCycle()
    }

    if (success) {
      closeCycleActionDialog()
    }
  }

  const isCycleConfirmActionLoading = isCycleUndoing || isCycleResetting || isCycleDeleting
  const cycleConfirmTitle =
    cycleActionDialogOpenedItem === 'undo-last'
      ? 'Undo last transaction?'
      : cycleActionDialogOpenedItem === 'reset-cycle'
        ? 'Reset cycle?'
        : cycleActionDialogOpenedItem === 'delete-cycle'
          ? 'Delete cycle?'
          : ''
  const cycleConfirmDescription =
    cycleActionDialogOpenedItem === 'undo-last'
      ? `This will remove the latest transaction from "${selectedCycleItem?.name ?? ''}".`
      : cycleActionDialogOpenedItem === 'reset-cycle'
        ? `This will remove all transactions from "${selectedCycleItem?.name ?? ''}".`
        : cycleActionDialogOpenedItem === 'delete-cycle'
          ? `This will remove all transactions and permanently delete "${selectedCycleItem?.name ?? ''}".`
          : ''
  const cycleConfirmActionLabel =
    cycleActionDialogOpenedItem === 'undo-last'
      ? 'Undo transaction'
      : cycleActionDialogOpenedItem === 'reset-cycle'
        ? 'Reset cycle'
        : cycleActionDialogOpenedItem === 'delete-cycle'
          ? 'Delete cycle'
          : 'Confirm'

  const filteredTransactions = useMemo(() => {
    if (!selectedCycle) return transactions
    return transactions.filter((transaction) => transaction.cycle === selectedCycle)
  }, [transactions, selectedCycle])

  const selectedTransaction = useMemo(
    () =>
      transactions.find((transaction) => transaction.id === transactionDetailsDialogOpenedItem) ??
      null,
    [transactions, transactionDetailsDialogOpenedItem]
  )

  const editingTransaction = useMemo(
    () =>
      transactions.find((transaction) => transaction.id === updateTransactionDialogOpenedItem) ??
      null,
    [transactions, updateTransactionDialogOpenedItem]
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
    try {
      const deletedTransactionId = await deleteTransactionMutation.mutateAsync(transactionId)
      queryClient.setQueryData<TradeTransaction[]>(transactionsQueryKey, (prev = []) =>
        prev.filter((transaction) => transaction.id !== deletedTransactionId)
      )
      closeTransactionDetailsDialog()
      closeDeleteTransactionConfirmationDialog()
      appToast.success('Transaction deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction'
      appToast.fail(message)
    }
  }

  const requestDeleteSelectedTransaction = async () => {
    if (!selectedTransaction) return
    if (isSelectedTransactionLastInCycle) {
      await executeDeleteTransaction(selectedTransaction.id)
      return
    }
    openDeleteTransactionConfirmationDialog(selectedTransaction.id)
  }

  const openEditTransactionForm = (transaction: TradeTransaction) => {
    openUpdateTransactionDialog(transaction.id)
    closeCreateTransactionDialog()

    setTransactionType(transaction.type)
    setTransactionCycle(transaction.cycle)
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
      setTransactionDescription(transaction.description ?? '')
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
      setTransactionDescription(transaction.description ?? '')
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
      setTransactionDescription(transaction.description ?? '')
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

    closeTransactionDetailsDialog()
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
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
          a.cycleName.localeCompare(b.cycleName)
      )
  }, [cycleOptions, transactions])

  useEffect(() => {
    if (!transactionCycle && cycleOptions.length > 0) {
      setTransactionCycle(cycleOptions[0].name)
    }
  }, [transactionCycle, cycleOptions])

  useEffect(() => {
    if (!selectedCycle) return
    setTransactionCycle(selectedCycle)
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

  const openInstitutionDialog = (target: 'sender' | 'recipient') => {
    openCreateInstitutionDialog(target)
    setNewInstitutionName('')
    setNewInstitutionIcon(null)
  }

  const createInstitution = async () => {
    const name = newInstitutionName.trim()
    if (!name) return
    try {
      const created = await createInstitutionMutation.mutateAsync({
        name,
        icon: newInstitutionIcon ?? undefined,
      })
      queryClient.setQueryData<Institution[]>(institutionsQueryKey, (prev = []) => {
        const withoutCurrent = prev.filter(
          (institutionItem) =>
            institutionItem.id !== created.id && institutionItem.name !== created.name
        )
        return [...withoutCurrent, created].sort((a, b) => a.name.localeCompare(b.name))
      })
      if (createInstitutionDialogOpenedItem === 'sender') {
        setSenderInstitution(created.name)
      } else if (createInstitutionDialogOpenedItem === 'recipient') {
        setRecipientInstitution(created.name)
      }
      closeCreateInstitutionDialog()
      setNewInstitutionName('')
      setNewInstitutionIcon(null)
      appToast.success('Institution created')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create institution'
      appToast.fail(message)
    }
  }

  const handleCreateTransactionSuccess = (createdTransactions: TradeTransaction[]) => {
    queryClient.setQueryData<TradeTransaction[]>(transactionsQueryKey, (prev = []) => [
      ...prev,
      ...createdTransactions,
    ])
    void queryClient.invalidateQueries({ queryKey: cyclesQueryKey })
    resetForm()
    closeCreateTransactionDialog()
  }

  const handleUpdateTransactionSuccess = (updatedTransaction: TradeTransaction) => {
    queryClient.setQueryData<TradeTransaction[]>(transactionsQueryKey, (prev = []) =>
      prev.map((transaction) =>
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      )
    )
    void queryClient.invalidateQueries({ queryKey: cyclesQueryKey })
    resetForm()
    closeUpdateTransactionDialog()
  }

  const nextCycleName = useMemo(
    () => getNextCycleName(cycleOptions.map((cycleItem) => cycleItem.name)),
    [cycleOptions]
  )

  const openCreateTransactionForm = () => {
    resetForm()
    openCreateTransactionDialog()
  }

  const handleFormOpenChange = (open: boolean) => {
    if (isUpdateTransactionDialogOpen) {
      if (!open) {
        closeUpdateTransactionDialog()
      }
    } else if (open) {
      openCreateTransactionDialog()
    } else {
      closeCreateTransactionDialog()
    }
    if (!open) {
      resetForm()
    }
  }

  const handleFormCancel = () => {
    resetForm()
    closeCreateTransactionDialog()
    closeUpdateTransactionDialog()
  }

  const handleCycleDialogOpenChange = (open: boolean) => {
    if (open) {
      openCreateCycleDialog()
    } else {
      closeCreateCycleDialog()
    }
    if (open) {
      setCycleErrorMessage(null)
    }
  }

  const handleInstitutionDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeCreateInstitutionDialog()
    }
    if (!open) {
      setNewInstitutionName('')
      setNewInstitutionIcon(null)
      setNewInstitutionIconPreviewUrl(null)
    }
  }

  const handleInstitutionDialogCancel = () => {
    closeCreateInstitutionDialog()
    setNewInstitutionName('')
    setNewInstitutionIcon(null)
    setNewInstitutionIconPreviewUrl(null)
  }

  const handleSelectedTransactionDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeTransactionDetailsDialog()
      closeDeleteTransactionConfirmationDialog()
    }
  }

  return {
    availableCycleUsdtBalance,
    cycleConfirmActionLabel,
    cycleConfirmDescription,
    cycleConfirmTitle,
    cycleErrorMessage,
    cycleOptions,
    cycleSummaries,
    cycleToolbarError,
    createCycleDialog: {
      isOpen: isCreateCycleDialogOpen,
      open: openCreateCycleDialog,
      close: closeCreateCycleDialog,
    },
    createInstitutionDialog: {
      isOpen: isCreateInstitutionDialogOpen,
      openedItem: createInstitutionDialogOpenedItem,
      open: openCreateInstitutionDialog,
      close: closeCreateInstitutionDialog,
    },
    createTransactionDialog: {
      isOpen: isCreateTransactionDialogOpen,
      open: openCreateTransactionDialog,
      close: closeCreateTransactionDialog,
    },
    cycleActionDialog: {
      isOpen: isCycleActionDialogOpen,
      openedItem: cycleActionDialogOpenedItem,
      open: openCycleActionDialog,
      close: closeCycleActionDialog,
    },
    editingTransaction,
    filteredTransactions,
    getInstitutionIconSrc,
    handleCreateTransactionSuccess,
    handleCycleDialogOpenChange,
    handleFormCancel,
    handleFormOpenChange,
    handleInstitutionDialogCancel,
    handleInstitutionDialogOpenChange,
    handleSelectedTransactionDialogOpenChange,
    handleUpdateTransactionSuccess,
    institutionIconInputRef,
    institutionOptions,
    isCycleConfirmActionLoading,
    isCycleDeleting,
    isCycleLockedBySelection,
    isCycleRenaming,
    isCycleResetting,
    isCycleSaving,
    isCycleUndoing,
    isInstitutionSaving,
    isLoading,
    isSellBalanceWarningVisible,
    isTransactionDeleting,
    ledgerRows,
    newInstitutionIconPreviewUrl,
    newInstitutionName,
    nextCycleName,
    openCreateTransactionForm,
    openEditTransactionForm,
    openInstitutionDialog,
    requestDeleteCycle,
    requestDeleteSelectedTransaction,
    requestResetCycle,
    requestUndoLastTransaction,
    selectedCycle,
    selectedCycleItem,
    selectedTransaction,
    setCycleErrorMessage,
    setNewInstitutionIcon,
    setNewInstitutionName,
    setSelectedCycle,
    stats,
    syncTransactionFormValues,
    transactionDetailsDialog: {
      isOpen: isTransactionDetailsDialogOpen,
      openedItem: transactionDetailsDialogOpenedItem,
      open: openTransactionDetailsDialog,
      close: closeTransactionDetailsDialog,
    },
    transactionFormValues,
    transactions,
    updateTransactionDialog: {
      isOpen: isUpdateTransactionDialogOpen,
      openedItem: updateTransactionDialogOpenedItem,
      open: openUpdateTransactionDialog,
      close: closeUpdateTransactionDialog,
    },
    createCycle,
    createInstitution,
    deleteTransactionConfirmationDialog: {
      isOpen: isDeleteTransactionConfirmationDialogOpen,
      openedItem: deleteTransactionConfirmationDialogOpenedItem,
      open: openDeleteTransactionConfirmationDialog,
      close: closeDeleteTransactionConfirmationDialog,
    },
    executeDeleteTransaction,
    executePendingCycleAction,
    renameSelectedCycle,
  }
}
