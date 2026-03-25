'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { Form } from '@/components/ui/shadcnui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Toggle } from '@/components/ui/shadcnui/toggle'
import { InputField } from '@/components/common/input-field'
import { NumberInput } from '@/components/common/number-input'
import { useSimulate } from '../(routing)/(protected)/simulate/hooks/use-simulate'
import { calculateExchangeLoops } from './calculate'
import { calculateFormSchema, type CalculateFormValues } from './calculate-form.schema'

const DEFAULT_VALUES: CalculateFormValues = {
  localCurrency: 'TRY',
  exchangeRate: '',
  exchangeTaxPercent: '',
  useExchangeRate: true,
  applyCommission: false,
  startingCapital: '',
  buyCommission: '',
  sellRate: '',
  loopCount: '',
  compoundProfits: true,
}

const LOCAL_CURRENCY_META = {
  TRY: {
    label: 'TRY',
    name: 'TRY',
    symbol: '₺',
  },
  SYP: {
    label: 'SYP',
    name: 'SYP',
    symbol: '£',
  },
} as const

export const CalculateForm = () => {
  const { setResult } = useSimulate()
  const searchParams = useSearchParams()
  const paramsKey = searchParams.toString()
  const queryDefaults = useMemo<CalculateFormValues>(() => {
    const localCurrency = searchParams.get('localCurrency')
    const useExchangeRate = searchParams.get('useExchangeRate')
    const applyCommission = searchParams.get('applyCommission')
    const compoundProfits = searchParams.get('compoundProfits')

    return {
      ...DEFAULT_VALUES,
      localCurrency: localCurrency === 'SYP' ? 'SYP' : 'TRY',
      exchangeRate: searchParams.get('exchangeRate') ?? DEFAULT_VALUES.exchangeRate,
      exchangeTaxPercent:
        searchParams.get('exchangeTaxPercent') ?? DEFAULT_VALUES.exchangeTaxPercent,
      startingCapital: searchParams.get('startingCapital') ?? DEFAULT_VALUES.startingCapital,
      buyCommission: searchParams.get('buyCommission') ?? DEFAULT_VALUES.buyCommission,
      sellRate: searchParams.get('sellRate') ?? DEFAULT_VALUES.sellRate,
      loopCount: searchParams.get('loopCount') ?? DEFAULT_VALUES.loopCount,
      useExchangeRate:
        useExchangeRate === null ? DEFAULT_VALUES.useExchangeRate : useExchangeRate !== 'false',
      applyCommission:
        applyCommission === null ? DEFAULT_VALUES.applyCommission : applyCommission === 'true',
      compoundProfits:
        compoundProfits === null ? DEFAULT_VALUES.compoundProfits : compoundProfits === 'true',
    }
  }, [searchParams])
  const form = useForm<CalculateFormValues>({
    resolver: zodResolver(calculateFormSchema),
    defaultValues: queryDefaults,
  })

  useEffect(() => {
    form.reset(queryDefaults)

    if (searchParams.get('autoCalculate') !== 'true') return

    try {
      setResult(calculateExchangeLoops(queryDefaults))
    } catch {
      setResult(null)
    }
  }, [form, queryDefaults, paramsKey, searchParams, setResult])

  const isBuyingUsdtInLocalCurrency = form.watch('useExchangeRate')
  const applyCommission = form.watch('applyCommission')
  const localCurrency = form.watch('localCurrency') === 'SYP' ? 'SYP' : DEFAULT_VALUES.localCurrency
  const localCurrencyMeta = LOCAL_CURRENCY_META[localCurrency]
  const startingCapital = Number.parseFloat(form.watch('startingCapital'))
  const exchangeRate = Number.parseFloat(form.watch('exchangeRate'))
  const exchangeTaxPercent = Number.parseFloat(form.watch('exchangeTaxPercent'))
  const effectiveExchangeRate =
    Number.isFinite(exchangeRate) &&
    exchangeRate > 0 &&
    Number.isFinite(exchangeTaxPercent) &&
    exchangeTaxPercent >= 0
      ? exchangeRate * (1 + exchangeTaxPercent / 100)
      : null
  const approximateLocalTotal =
    effectiveExchangeRate !== null && Number.isFinite(startingCapital) && startingCapital > 0
      ? startingCapital * effectiveExchangeRate
      : null
  const approximateLocalAtBaseRate =
    Number.isFinite(exchangeRate) &&
    exchangeRate > 0 &&
    Number.isFinite(startingCapital) &&
    startingCapital > 0
      ? startingCapital * exchangeRate
      : null

  const onSubmit = (values: CalculateFormValues) => {
    setResult(calculateExchangeLoops(values))
  }

  return (
    <section className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold">Exchange Loop Calculator</h1>
      <p className="text-muted-foreground mb-6 text-sm">Configure your loop values below.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1">
          <InputField
            control={form.control}
            name="startingCapital"
            label="Starting capital (USD)"
            render={(field) => (
              <NumberInput
                name={field.name}
                value={field.value ?? ''}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(value) => field.onChange(value)}
                startAction={<span className="text-muted-foreground text-sm">$</span>}
              />
            )}
          />

          <InputField
            control={form.control}
            name="localCurrency"
            label="Local currency"
            render={(field) => (
              <Select
                value={field.value ?? queryDefaults.localCurrency}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select local currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="SYP">SYP</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <InputField
            control={form.control}
            name="useExchangeRate"
            label={`Buying USDT in ${localCurrencyMeta.name} or dollars`}
            className="my-1! flex items-center justify-start gap-3 space-y-0 **:data-[slot=label]:pointer-events-none"
            render={(field) => (
              <Toggle
                pressed={field.value}
                onPressedChange={field.onChange}
                variant="outline"
                className="min-w-24 justify-center border-0 bg-yellow-500 text-black hover:bg-yellow-600 data-[state=on]:bg-yellow-500 data-[state=on]:text-black data-[state=on]:hover:bg-yellow-600"
              >
                {field.value
                  ? `Buying USDT in ${localCurrencyMeta.name}`
                  : 'Buying USDT in dollars'}
              </Toggle>
            )}
          />

          {isBuyingUsdtInLocalCurrency && (
            <InputField
              control={form.control}
              name="applyCommission"
              label="Apply percent % commission?"
              className="my-1! flex items-center justify-start gap-3 space-y-0 **:data-[slot=label]:pointer-events-none"
              render={(field) => (
                <Toggle
                  pressed={field.value}
                  onPressedChange={field.onChange}
                  variant="outline"
                  className="min-w-24 justify-center border-0 text-white data-[state=off]:bg-red-600 data-[state=off]:text-white data-[state=off]:hover:bg-red-700 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:hover:bg-emerald-700"
                >
                  {field.value ? 'Yes' : 'No'}
                </Toggle>
              )}
            />
          )}

          <InputField
            control={form.control}
            name="compoundProfits"
            label="Compound profits?"
            className="my-1! flex items-center justify-start gap-3 space-y-0 **:data-[slot=label]:pointer-events-none"
            render={(field) => (
              <Toggle
                pressed={field.value}
                onPressedChange={field.onChange}
                variant="outline"
                className="min-w-24 justify-center border-0 text-white data-[state=off]:bg-red-600 data-[state=off]:text-white data-[state=off]:hover:bg-red-700 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:hover:bg-emerald-700"
              >
                {field.value ? 'Yes' : 'No'}
              </Toggle>
            )}
          />

          <InputField
            control={form.control}
            name="exchangeRate"
            label={`Exchange rate (${localCurrencyMeta.label})`}
            description={
              approximateLocalAtBaseRate === null ? null : (
                <span className="text-xs">
                  ≈ {localCurrencyMeta.symbol}
                  {approximateLocalAtBaseRate.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </span>
              )
            }
            render={(field) => (
              <NumberInput
                name={field.name}
                value={field.value ?? ''}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(value) => field.onChange(value)}
                startAction={
                  <span className="text-muted-foreground text-sm">{localCurrencyMeta.symbol}</span>
                }
              />
            )}
          />

          {!isBuyingUsdtInLocalCurrency && (
            <InputField
              control={form.control}
              name="exchangeTaxPercent"
              label="Exchange tax percent %"
              description={
                effectiveExchangeRate === null ? null : (
                  <span className="text-xs">
                    Effective rate: {localCurrencyMeta.symbol}
                    {effectiveExchangeRate.toFixed(2)}
                    {approximateLocalTotal !== null
                      ? ` | ≈ ${localCurrencyMeta.symbol}${approximateLocalTotal.toLocaleString(
                          'en-US',
                          {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          }
                        )}`
                      : ''}
                  </span>
                )
              }
              render={(field) => (
                <NumberInput
                  name={field.name}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(value) => field.onChange(value)}
                  allowNegative={false}
                  startAction={<span className="text-muted-foreground text-sm">%</span>}
                />
              )}
            />
          )}

          {(!isBuyingUsdtInLocalCurrency || applyCommission) && (
            <InputField
              control={form.control}
              name="buyCommission"
              label="Buy USDT commission (%)"
              render={(field) => (
                <NumberInput
                  name={field.name}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(value) => field.onChange(value)}
                  allowNegative={false}
                  startAction={<span className="text-muted-foreground text-sm">%</span>}
                />
              )}
            />
          )}

          <InputField
            control={form.control}
            name="sellRate"
            label={`Sell full USDT for (${localCurrencyMeta.label})`}
            render={(field) => (
              <NumberInput
                name={field.name}
                value={field.value ?? ''}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(value) => field.onChange(value)}
                startAction={
                  <span className="text-muted-foreground text-sm">{localCurrencyMeta.symbol}</span>
                }
              />
            )}
          />

          <InputField
            control={form.control}
            name="loopCount"
            label="Loop count"
            render={(field) => (
              <NumberInput
                name={field.name}
                value={field.value ?? ''}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(value) => field.onChange(value)}
                min="1"
                step="1"
              />
            )}
          />

          <Button type="submit" className="mt-4 w-full">
            Calculate
          </Button>
        </form>
      </Form>
    </section>
  )
}
