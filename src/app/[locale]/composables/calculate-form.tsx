'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/shadcnui/form'
import { calculateExchangeLoops } from './calculate'
import { Toggle } from '@/components/ui/shadcnui/toggle'
import { Button } from '@/components/ui/shadcnui/button'
import { InputField } from '@/components/common/input-field'
import { NumberInput } from '@/components/common/number-input'
import { calculateFormSchema, type CalculateFormValues } from './calculate-form.schema'
import type { CalculationResult } from './calculate'

type CalculateFormProps = {
  onCalculate: (result: CalculationResult) => void
}

export const CalculateForm = ({ onCalculate }: CalculateFormProps) => {
  const form = useForm<CalculateFormValues>({
    resolver: zodResolver(calculateFormSchema),
    defaultValues: {
      exchangeRate: '',
      exchangeTaxPercent: '',
      useExchangeRate: true,
      applyCommission: false,
      startingCapital: '',
      buyCommission: '',
      sellRate: '',
      loopCount: '',
      compoundProfits: true,
    },
  })
  const isBuyingUsdtInLira = form.watch('useExchangeRate')
  const applyCommission = form.watch('applyCommission')
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
  const approximateTryTotal =
    effectiveExchangeRate !== null && Number.isFinite(startingCapital) && startingCapital > 0
      ? startingCapital * effectiveExchangeRate
      : null
  const approximateTryAtBaseRate =
    Number.isFinite(exchangeRate) &&
    exchangeRate > 0 &&
    Number.isFinite(startingCapital) &&
    startingCapital > 0
      ? startingCapital * exchangeRate
      : null

  const onSubmit = (values: CalculateFormValues) => {
    onCalculate(calculateExchangeLoops(values))
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
            name="useExchangeRate"
            label="Buying USDT in lira or dollars"
            className="my-1! flex items-center justify-start gap-3 space-y-0 [&_[data-slot=label]]:pointer-events-none"
            render={(field) => (
              <Toggle
                pressed={field.value}
                onPressedChange={field.onChange}
                variant="outline"
                className="min-w-24 justify-center border-0 bg-yellow-500 text-black hover:bg-yellow-600 data-[state=on]:bg-yellow-500 data-[state=on]:text-black data-[state=on]:hover:bg-yellow-600"
              >
                {field.value ? 'Buying USDT in lira' : 'Buying USDT in dollars'}
              </Toggle>
            )}
          />

          {isBuyingUsdtInLira && (
            <InputField
              control={form.control}
              name="applyCommission"
              label="Apply percent % commission?"
              className="my-1! flex items-center justify-start gap-3 space-y-0 [&_[data-slot=label]]:pointer-events-none"
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
            className="my-1! flex items-center justify-start gap-3 space-y-0 [&_[data-slot=label]]:pointer-events-none"
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
            label="Exchange rate (TRY)"
            description={
              approximateTryAtBaseRate === null ? null : (
                <span className="text-xs">
                  ≈ ₺
                  {approximateTryAtBaseRate.toLocaleString('en-US', {
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
                startAction={<span className="text-muted-foreground text-sm">₺</span>}
              />
            )}
          />

          {!isBuyingUsdtInLira && (
            <InputField
              control={form.control}
              name="exchangeTaxPercent"
              label="Exchange tax percent %"
              description={
                effectiveExchangeRate === null ? null : (
                  <span className="text-xs">
                    Effective rate: ₺{effectiveExchangeRate.toFixed(2)}
                    {approximateTryTotal !== null
                      ? ` | ≈ ₺${approximateTryTotal.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}`
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

          {(!isBuyingUsdtInLira || applyCommission) && (
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
            label="Sell full USDT for (TRY)"
            render={(field) => (
              <NumberInput
                name={field.name}
                value={field.value ?? ''}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(value) => field.onChange(value)}
                startAction={<span className="text-muted-foreground text-sm">₺</span>}
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
