'use client'

import { useWatch, type Control } from 'react-hook-form'
import { InputField } from '@/components/common/input-field'
import { NumberInput } from '@/components/common/number-input'
import { Button } from '@/components/ui/shadcnui/button'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/shadcnui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Toggle } from '@/components/ui/shadcnui/toggle'
import { ArrowRightLeft, ReceiptText, Trash2 } from 'lucide-react'
import type { PriceCalculatorValues } from '../price-calculator.schema'
import { CURRENCIES, STEP_TYPES, type Currency } from '../price-calculator.types'

type Props = {
  control: Control<PriceCalculatorValues, unknown>
  index: number
  value: string
  onRemove: () => void
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  SYP: '£',
  TRY: '₺',
  USD: '$',
  USDT: '$',
}

const parseNumber = (value: string | undefined) => {
  if (!value?.trim()) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatAmount = (amount: number | null, currency: Currency, maximumFractionDigits = 2) => {
  if (amount === null) return '-'
  return `${CURRENCY_SYMBOLS[currency]}${amount.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
  })}`
}

export const PriceCalculatorStepCard = ({ control, index, value, onRemove }: Props) => {
  const baseName = `steps.${index}` as const
  const step = useWatch({ control, name: baseName })
  const stepType = step?.type ?? 'EXPENSE'
  const fromAmount = parseNumber(step?.fromAmount)
  const toAmount = parseNumber(step?.toAmount)
  const fixedFee = parseNumber(step?.fixedFee) ?? 0
  const percentFee = parseNumber(step?.percentFee) ?? 0
  const percentFeeAmount = fromAmount === null ? null : fromAmount * (percentFee / 100)
  const totalSpent = fromAmount === null ? null : fromAmount + fixedFee + (percentFeeAmount ?? 0)
  const label = step?.label?.trim() || `Step ${index + 1}`

  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 px-4 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="relative min-h-28 py-3 pr-24">
        <AccordionTrigger className="relative min-w-0 py-0 text-left hover:no-underline [&>svg]:absolute [&>svg]:top-1.5 [&>svg]:right-11">
          <div className="min-w-0 pr-20">
            <div className="flex items-center gap-2 text-sm font-bold">
              {stepType === 'EXPENSE' ? (
                <ReceiptText className="h-4 w-4 text-amber-500" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 text-sky-500" />
              )}
              <span>Step {index + 1}</span>
              <span className="truncate">{label}</span>
            </div>

            <div className="mt-2 flex min-h-16 flex-wrap content-start items-start gap-2 text-sm">
              {stepType === 'EXPENSE' ? (
                <>
                  <SummaryPill
                    label="Spent"
                    value={formatAmount(totalSpent, step?.fromCurrency ?? 'SYP')}
                    valueClassName="text-red-700 dark:text-red-300"
                  />
                  <SummaryPill
                    label="Fee"
                    value={formatAmount(
                      fixedFee + (percentFeeAmount ?? 0),
                      step?.fromCurrency ?? 'SYP'
                    )}
                    valueClassName="text-amber-700 dark:text-amber-300"
                  />
                  <SummaryPill
                    label="Counts toward USDT cost"
                    value={step?.includeInUsdtCostBasis ? 'Yes' : 'No'}
                  />
                </>
              ) : (
                <>
                  <SummaryPill
                    label="From"
                    value={formatAmount(totalSpent, step?.fromCurrency ?? 'SYP')}
                    valueClassName="text-red-700 dark:text-red-300"
                  />
                  <SummaryPill
                    label="Receive"
                    value={formatAmount(
                      toAmount,
                      step?.toCurrency ?? 'USD',
                      step?.toCurrency === 'USDT' ? 4 : 2
                    )}
                    valueClassName="text-emerald-700 dark:text-emerald-300"
                  />
                  <SummaryPill
                    label="Path"
                    value={`${step?.fromCurrency ?? 'SYP'} -> ${step?.toCurrency ?? 'USD'}`}
                  />
                </>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          className="absolute top-1 right-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AccordionContent className="pb-4">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            control={control}
            name={`${baseName}.type`}
            label="Step type"
            render={(field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'EXPENSE' ? 'Expense / cashout' : 'Conversion'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <InputField
            control={control}
            name={`${baseName}.label`}
            label="Step label"
            render={(field) => (
              <input
                {...field}
                className="border-input flex h-10 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm"
              />
            )}
          />

          <InputField
            control={control}
            name={`${baseName}.fromCurrency`}
            label={stepType === 'EXPENSE' ? 'Expense currency' : 'From currency'}
            render={(field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <InputField
            control={control}
            name={`${baseName}.fromAmount`}
            label={stepType === 'EXPENSE' ? 'Base amount' : 'From amount'}
            render={(field) => (
              <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
            )}
          />

          {stepType === 'CONVERSION' && (
            <>
              <InputField
                control={control}
                name={`${baseName}.toCurrency`}
                label="To currency"
                render={(field) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <InputField
                control={control}
                name={`${baseName}.toAmount`}
                label="To amount"
                render={(field) => (
                  <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </>
          )}

          <InputField
            control={control}
            name={`${baseName}.fixedFee`}
            label={stepType === 'EXPENSE' ? 'Extra fixed fee' : 'Fixed fee in source currency'}
            render={(field) => (
              <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
            )}
          />

          <InputField
            control={control}
            name={`${baseName}.percentFee`}
            label="Percent fee on source amount"
            render={(field) => (
              <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
            )}
          />

          <InputField
            control={control}
            name={`${baseName}.includeInUsdtCostBasis`}
            label="Include in USDT cost basis"
            className="my-1! flex items-center gap-3 space-y-0 **:data-[slot=label]:pointer-events-none"
            render={(field) => (
              <Toggle
                pressed={field.value}
                onPressedChange={field.onChange}
                variant="outline"
                className="min-w-24 justify-center"
              >
                {field.value ? 'Included' : 'Excluded'}
              </Toggle>
            )}
          />

          <InputField
            control={control}
            name={`${baseName}.note`}
            label="Note"
            render={(field) => (
              <input
                {...field}
                className="border-input flex h-10 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm"
              />
            )}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

const SummaryPill = ({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) => (
  <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
    <span className="text-muted-foreground mr-1 text-xs font-semibold uppercase">{label}</span>
    <span className={['text-sm font-bold', valueClassName].filter(Boolean).join(' ')}>{value}</span>
  </div>
)
