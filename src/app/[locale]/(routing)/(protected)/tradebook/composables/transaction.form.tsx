'use client'

import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { CURRENCY_SYMBOLS } from '@/constants'
import { AlertTriangle, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Form } from '@/components/ui/shadcnui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert } from '@/components/ui/shadcnui/alert'
import { Button } from '@/components/ui/shadcnui/button'
import { Select } from '@/components/ui/shadcnui/select'
import { AlertTitle } from '@/components/ui/shadcnui/alert'
import { InputField } from '@/components/common/input-field'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import { Combobox } from '@/components/ui/shadcnui/combobox'
import { SelectItem } from '@/components/ui/shadcnui/select'
import { SelectValue } from '@/components/ui/shadcnui/select'
import { NumberInput } from '@/components/common/number-input'
import { Accordion } from '@/components/ui/shadcnui/accordion'
import { SelectTrigger } from '@/components/ui/shadcnui/select'
import { SelectContent } from '@/components/ui/shadcnui/select'
import { AlertDescription } from '@/components/ui/shadcnui/alert'
import { AccordionItem } from '@/components/ui/shadcnui/accordion'
import { ButtonWithTooltip } from '@/components/ui/shadcnui/button'
import { AccordionTrigger } from '@/components/ui/shadcnui/accordion'
import { AccordionContent } from '@/components/ui/shadcnui/accordion'
import type { CycleOption, InstitutionOption } from '../tradebook.types'
import {
  transactionFormSchema,
  type TradebookTransactionFormValues,
} from '../schemas/transaction-form.schema'

export type TransactionFormProps = {
  values: TradebookTransactionFormValues
  errorMessage: string | null
  isSubmitting: boolean
  submitLabel: string
  cycleOptions: CycleOption[]
  institutionOptions: InstitutionOption[]
  availableCycleUsdtBalance: number
  isSellBalanceWarningVisible: boolean
  isCycleLockedBySelection: boolean
  nextCycleName: string
  onValuesChange: (values: TradebookTransactionFormValues) => void
  onSubmit: () => void
  onCancel: () => void
  onOpenCreateCycleDialog: () => void
  onOpenCreateInstitutionDialog: (role: 'sender' | 'recipient') => void
  getInstitutionIconSrc: (iconFileName: string | null) => string | null
}

export const TransactionForm = ({
  values,
  onSubmit,
  onCancel,
  submitLabel,
  errorMessage,
  isSubmitting,
  cycleOptions,
  onValuesChange,
  institutionOptions,
  getInstitutionIconSrc,
  onOpenCreateCycleDialog,
  isCycleLockedBySelection,
  availableCycleUsdtBalance,
  isSellBalanceWarningVisible,
  onOpenCreateInstitutionDialog,
}: TransactionFormProps) => {
  const form = useForm<TradebookTransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: values,
  })
  const [cycleSearchTerm, setCycleSearchTerm] = useState(values.transactionCycle)
  const [isCycleComboboxOpen, setIsCycleComboboxOpen] = useState(false)

  useEffect(() => {
    form.reset(values)
    setCycleSearchTerm(values.transactionCycle)
  }, [form, values])

  useEffect(() => {
    const subscription = form.watch((nextValues) => {
      onValuesChange(nextValues as TradebookTransactionFormValues)
    })
    return () => subscription.unsubscribe()
  }, [form, onValuesChange])

  const transactionType = form.watch('transactionType')
  const transactionCurrency = form.watch('transactionCurrency')
  const buyInputMode = form.watch('buyInputMode')
  const buyFeeUnit = form.watch('buyFeeUnit')
  const sellInputMode = form.watch('sellInputMode')
  const sellFeeUnit = form.watch('sellFeeUnit')
  const transactionCycle = form.watch('transactionCycle')
  const payingWithCash = form.watch('payingWithCash')

  const filteredCycleOptions = useMemo(() => {
    const q = cycleSearchTerm.trim().toLowerCase()
    if (!q) return cycleOptions
    return cycleOptions.filter((cycleItem) => cycleItem.name.toLowerCase().includes(q))
  }, [cycleOptions, cycleSearchTerm])

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
            onClick={() => onOpenCreateInstitutionDialog(role)}
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

  return (
    <>
      {isSellBalanceWarningVisible && (
        <Alert className="mt-2 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Balance warning</AlertTitle>
          <AlertDescription>
            Amount sold is higher than this cycle&apos;s available USDT balance.
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => onSubmit())} className="mt-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              control={form.control}
              name="transactionType"
              label="Type"
              render={(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />

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
                    form.setValue('transactionCycle', '')
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
                        onClick={onOpenCreateCycleDialog}
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
                      <p className="text-muted-foreground px-2 py-1.5 text-sm">No cycles found</p>
                    ) : (
                      filteredCycleOptions.map((cycleItem) => (
                        <button
                          key={cycleItem.id}
                          type="button"
                          className="hover:bg-accent hover:text-accent-foreground w-full rounded px-2 py-1.5 text-left text-sm"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            form.setValue('transactionCycle', cycleItem.name)
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
                          form.setValue('buyInputMode', 'price-per-unit')
                          form.setValue('buyAmountReceived', '')
                        } else {
                          form.setValue('buyInputMode', 'amount-received')
                          form.setValue('buyPricePerUnit', '')
                        }
                      }}
                    >
                      {buyInputMode === 'amount-received' ? 'Mode: Amt' : 'Mode: PPU'}
                    </ButtonWithTooltip>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      control={form.control}
                      name="transactionValue"
                      label="Transaction value"
                      render={(field) => (
                        <NumberInput
                          name={field.name}
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={field.onChange}
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
                                form.setValue(
                                  'transactionCurrency',
                                  transactionCurrency === 'USD' ? 'TRY' : 'USD'
                                )
                              }
                            >
                              {CURRENCY_SYMBOLS[transactionCurrency]}
                            </Button>
                          }
                        />
                      )}
                    />

                    <InputField
                      control={form.control}
                      name={
                        buyInputMode === 'amount-received' ? 'buyAmountReceived' : 'buyPricePerUnit'
                      }
                      label={
                        buyInputMode === 'amount-received'
                          ? 'Amount received (USDT)'
                          : 'Price per unit (TRY)'
                      }
                      render={(field) => (
                        <NumberInput
                          name={field.name}
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={field.onChange}
                          startAction={
                            <span className="text-muted-foreground text-sm">
                              {buyInputMode === 'amount-received'
                                ? CURRENCY_SYMBOLS.USDT
                                : CURRENCY_SYMBOLS.TRY}
                            </span>
                          }
                        />
                      )}
                    />

                    {transactionCurrency === 'USD' && (
                      <InputField
                        control={form.control}
                        name="buyUsdTryRateAtBuy"
                        label="USD/TRY rate at buy"
                        render={(field) => (
                          <NumberInput
                            name={field.name}
                            value={field.value ?? ''}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            onChange={field.onChange}
                            startAction={
                              <span className="text-muted-foreground text-sm">
                                {CURRENCY_SYMBOLS.TRY}
                              </span>
                            }
                          />
                        )}
                      />
                    )}

                    <InputField
                      control={form.control}
                      name="buyFee"
                      label={`Fee (${buyFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT})`}
                      render={(field) => (
                        <NumberInput
                          name={field.name}
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={field.onChange}
                          placeholder="0.00"
                          endAction={
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-w-9 px-2 text-xs"
                              onClick={() =>
                                form.setValue(
                                  'buyFeeUnit',
                                  buyFeeUnit === 'percent' ? 'usdt' : 'percent'
                                )
                              }
                            >
                              {buyFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT}
                            </Button>
                          }
                        />
                      )}
                    />
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
                              form.setValue('payingWithCash', checked)
                              if (checked) {
                                form.setValue('senderInstitution', '')
                                form.setValue('senderIban', '')
                                form.setValue('senderName', '')
                                form.setValue('recipientInstitution', '')
                                form.setValue('recipientIban', '')
                                form.setValue('recipientName', '')
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
                                  form.watch('senderInstitution'),
                                  (nextValue) => form.setValue('senderInstitution', nextValue),
                                  payingWithCash
                                )}
                              </div>
                              <InputField
                                control={form.control}
                                name="senderIban"
                                label="IBAN"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                              <InputField
                                control={form.control}
                                name="senderName"
                                label="Name"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                            <p className="mb-3 text-sm font-semibold">Recipient information</p>
                            <div className="space-y-3">
                              <div>
                                <p className="mb-2 text-xs font-semibold">Institution</p>
                                {renderInstitutionCombobox(
                                  'recipient',
                                  form.watch('recipientInstitution'),
                                  (nextValue) => form.setValue('recipientInstitution', nextValue),
                                  payingWithCash
                                )}
                              </div>
                              <InputField
                                control={form.control}
                                name="recipientIban"
                                label="IBAN"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                              <InputField
                                control={form.control}
                                name="recipientName"
                                label="Name"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <InputField
                  control={form.control}
                  name="transactionDescription"
                  className="md:col-span-2"
                  label="Description (optional)"
                  render={(field) => (
                    <Textarea
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Add notes"
                      rows={3}
                    />
                  )}
                />

                <InputField
                  control={form.control}
                  name="occurredAt"
                  label="Datetime"
                  render={(field) => (
                    <Input
                      type="datetime-local"
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
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
                          form.setValue('sellInputMode', 'price-per-unit')
                          form.setValue('sellAmountReceived', '')
                        } else {
                          form.setValue('sellInputMode', 'amount-received')
                          form.setValue('sellPricePerUnit', '')
                        }
                      }}
                    >
                      {sellInputMode === 'amount-received' ? 'Mode: Amt' : 'Mode: PPU'}
                    </ButtonWithTooltip>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      control={form.control}
                      name="sellAmountSold"
                      label="Amount sold (USDT)"
                      render={(field) => (
                        <NumberInput
                          name={field.name}
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={field.onChange}
                          startAction={
                            <span className="text-muted-foreground text-sm">
                              {CURRENCY_SYMBOLS.USDT}
                            </span>
                          }
                          endAction={
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                              onClick={() =>
                                form.setValue(
                                  'sellAmountSold',
                                  availableCycleUsdtBalance.toFixed(4).replace(/\.?0+$/, '')
                                )
                              }
                            >
                              MAX
                            </button>
                          }
                        />
                      )}
                    />

                    <InputField
                      control={form.control}
                      name={
                        sellInputMode === 'amount-received'
                          ? 'sellAmountReceived'
                          : 'sellPricePerUnit'
                      }
                      label={
                        sellInputMode === 'amount-received'
                          ? 'Amount received (TRY)'
                          : 'Price per unit (TRY)'
                      }
                      render={(field) => (
                        <NumberInput
                          name={field.name}
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={field.onChange}
                          startAction={
                            <span className="text-muted-foreground text-sm">
                              {CURRENCY_SYMBOLS.TRY}
                            </span>
                          }
                        />
                      )}
                    />

                    <div className="text-muted-foreground -mt-2 text-xs md:col-span-2">
                      Available USDT balance:{' '}
                      {availableCycleUsdtBalance.toLocaleString('en-US', {
                        maximumFractionDigits: 4,
                      })}{' '}
                      USDT
                    </div>

                    <InputField
                      control={form.control}
                      name="sellFee"
                      label={`Fee (${sellFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT})`}
                      render={(field) => (
                        <NumberInput
                          name={field.name}
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={field.onChange}
                          placeholder="0.00"
                          endAction={
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-w-9 px-2 text-xs"
                              onClick={() =>
                                form.setValue(
                                  'sellFeeUnit',
                                  sellFeeUnit === 'percent' ? 'usdt' : 'percent'
                                )
                              }
                            >
                              {sellFeeUnit === 'percent' ? '%' : CURRENCY_SYMBOLS.USDT}
                            </Button>
                          }
                        />
                      )}
                    />
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
                              form.setValue('payingWithCash', checked)
                              if (checked) {
                                form.setValue('senderInstitution', '')
                                form.setValue('senderIban', '')
                                form.setValue('senderName', '')
                                form.setValue('recipientInstitution', '')
                                form.setValue('recipientIban', '')
                                form.setValue('recipientName', '')
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
                                  form.watch('senderInstitution'),
                                  (nextValue) => form.setValue('senderInstitution', nextValue),
                                  payingWithCash
                                )}
                              </div>
                              <InputField
                                control={form.control}
                                name="senderIban"
                                label="IBAN"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                              <InputField
                                control={form.control}
                                name="senderName"
                                label="Name"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                            <p className="mb-3 text-sm font-semibold">Recipient information</p>
                            <div className="space-y-3">
                              <div>
                                <p className="mb-2 text-xs font-semibold">Institution</p>
                                {renderInstitutionCombobox(
                                  'recipient',
                                  form.watch('recipientInstitution'),
                                  (nextValue) => form.setValue('recipientInstitution', nextValue),
                                  payingWithCash
                                )}
                              </div>
                              <InputField
                                control={form.control}
                                name="recipientIban"
                                label="IBAN"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                              <InputField
                                control={form.control}
                                name="recipientName"
                                label="Name"
                                render={(field) => (
                                  <Input
                                    name={field.name}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    placeholder="Optional"
                                    disabled={payingWithCash}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <InputField
                  control={form.control}
                  name="transactionDescription"
                  className="md:col-span-2"
                  label="Description (optional)"
                  render={(field) => (
                    <Textarea
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Add notes"
                      rows={3}
                    />
                  )}
                />

                <InputField
                  control={form.control}
                  name="occurredAt"
                  label="Datetime"
                  render={(field) => (
                    <Input
                      type="datetime-local"
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </>
            ) : transactionType === 'CYCLE_SETTLEMENT' ? (
              <>
                <InputField
                  control={form.control}
                  name="settlementToCycle"
                  label="Destination cycle"
                  render={(field) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        {cycleOptions
                          .filter((cycleItem) => cycleItem.name !== form.watch('transactionCycle'))
                          .map((cycleItem) => (
                            <SelectItem key={cycleItem.id} value={cycleItem.name}>
                              {cycleItem.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                <InputField
                  control={form.control}
                  name="settlementAmount"
                  label="Settlement amount (USDT)"
                  render={(field) => (
                    <NumberInput
                      name={field.name}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={field.onChange}
                      startAction={
                        <span className="text-muted-foreground text-sm">
                          {CURRENCY_SYMBOLS.USDT}
                        </span>
                      }
                      endAction={
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                          onClick={() =>
                            form.setValue(
                              'settlementAmount',
                              availableCycleUsdtBalance.toFixed(4).replace(/\.?0+$/, '')
                            )
                          }
                        >
                          MAX
                        </button>
                      }
                    />
                  )}
                />

                <div className="text-muted-foreground -mt-2 text-xs md:col-span-2">
                  Source cycle balance:{' '}
                  {availableCycleUsdtBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
                  USDT
                </div>

                <InputField
                  control={form.control}
                  name="transactionDescription"
                  className="md:col-span-2"
                  label="Description (optional)"
                  render={(field) => (
                    <Textarea
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Add transfer notes"
                      rows={3}
                    />
                  )}
                />

                <InputField
                  control={form.control}
                  name="occurredAt"
                  label="Datetime"
                  render={(field) => (
                    <Input
                      type="datetime-local"
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </>
            ) : (
              <>
                <InputField
                  control={form.control}
                  name="correctionAmount"
                  label="Correction amount (USDT)"
                  render={(field) => (
                    <NumberInput
                      name={field.name}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={field.onChange}
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
                            onClick={() =>
                              form.setValue(
                                'correctionAmount',
                                availableCycleUsdtBalance.toFixed(4).replace(/\.?0+$/, '')
                              )
                            }
                          >
                            MAX
                          </button>
                        ) : undefined
                      }
                    />
                  )}
                />

                <div className="text-muted-foreground -mt-2 text-xs md:col-span-2">
                  Cycle balance:{' '}
                  {availableCycleUsdtBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
                  USDT
                </div>

                <InputField
                  control={form.control}
                  name="occurredAt"
                  label="Datetime"
                  render={(field) => (
                    <Input
                      type="datetime-local"
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />

                <InputField
                  control={form.control}
                  name="transactionDescription"
                  className="md:col-span-2"
                  label="Description (optional)"
                  render={(field) => (
                    <Textarea
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Add notes"
                      rows={3}
                    />
                  )}
                />
              </>
            )}
          </div>

          {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
