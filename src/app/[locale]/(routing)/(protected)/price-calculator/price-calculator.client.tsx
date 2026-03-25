'use client'

import { useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppTabs } from '@/app/[locale]/composables/app-tabs'
import { Form } from '@/components/ui/shadcnui/form'
import { Accordion } from '@/components/ui/shadcnui/accordion'
import { Calculator, Coins, Receipt, TrendingUp } from 'lucide-react'
import {
  PRICE_CALCULATOR_DEFAULT_VALUES,
  priceCalculatorSchema,
  type PriceCalculatorValues,
} from './price-calculator.schema'
import { PriceCalculatorStepCard } from './composables/price-calculator-step-card'
import { PriceCalculatorSummaryView } from './composables/price-calculator-summary'
import { calculatePriceCalculatorSummary } from './price-calculator.math'
import { PriceCalculatorPresetsFab } from './composables/price-calculator-presets-fab'
import { PriceCalculatorSettingsDialog } from './composables/price-calculator-settings-dialog'

export const PriceCalculatorClient = () => {
  const form = useForm<PriceCalculatorValues>({
    resolver: zodResolver(priceCalculatorSchema),
    defaultValues: PRICE_CALCULATOR_DEFAULT_VALUES,
  })
  const [openStep, setOpenStep] = useState<string>('')

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  })

  const values = useWatch({ control: form.control })
  const normalizedValues: PriceCalculatorValues = {
    ...PRICE_CALCULATOR_DEFAULT_VALUES,
    ...values,
    steps:
      values.steps?.map((step, index) => ({
        ...PRICE_CALCULATOR_DEFAULT_VALUES.steps[Math.min(index, PRICE_CALCULATOR_DEFAULT_VALUES.steps.length - 1)],
        ...step,
      })) ?? PRICE_CALCULATOR_DEFAULT_VALUES.steps,
  }
  const summary = useMemo(
    () => calculatePriceCalculatorSummary(normalizedValues),
    [normalizedValues]
  )

  const appendSteps = (steps: PriceCalculatorValues['steps']) => {
    const nextIndex = fields.length
    append(steps)
    setOpenStep(`step-${nextIndex}`)
  }

  const removeStep = (index: number) => {
    const removedValue = `step-${index}`
    remove(index)

    if (openStep === removedValue) {
      if (fields.length <= 1) {
        setOpenStep('')
        return
      }

      const fallbackIndex = Math.max(0, index - 1)
      setOpenStep(`step-${fallbackIndex}`)
    }
  }

  return (
    <div className="min-h-full min-w-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_20%)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <AppTabs />
        </div>

        <div className="mb-6 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase dark:bg-sky-500/15">
                <Calculator className="h-3.5 w-3.5" />
                Advanced price calculator
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Step-based USDT scenario builder
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-6 sm:text-base">
                Build the exact path you used today: wallet cashouts, multiple USD buys, USDT buys,
                sell planning, and manual adjustments. Each step is processed in order, so this is much
                closer to how your real deals actually happen.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat icon={Receipt} label="Expenses" value="Cashout + manual" />
              <HeroStat icon={Coins} label="Conversions" value="Any path" />
              <HeroStat icon={TrendingUp} label="Target sell" value="Live" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Form {...form}>
            <section className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Scenario builder</h2>
                  <p className="text-muted-foreground text-sm">
                    Add every step in the exact order it happened.
                  </p>
                </div>

                <PriceCalculatorSettingsDialog
                  control={form.control}
                  currentUsdtHoldings={summary.usdtHoldings}
                  onFillTargetUsdtAmount={() => {
                    form.setValue(
                      'targetUsdtAmount',
                      summary.usdtHoldings > 0 ? String(summary.usdtHoldings) : '',
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                      }
                    )
                  }}
                />
              </div>

              <Accordion
                type="single"
                collapsible
                value={openStep}
                onValueChange={setOpenStep}
                className="mt-6 space-y-4"
              >
                {fields.map((field, index) => {
                  return (
                    <PriceCalculatorStepCard
                      key={field.id}
                      control={form.control}
                      index={index}
                      value={`step-${index}`}
                      onRemove={() => removeStep(index)}
                    />
                  )
                })}
              </Accordion>
            </section>
          </Form>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <PriceCalculatorSummaryView summary={summary} />
          </div>
        </div>
      </div>

      <PriceCalculatorPresetsFab onAppendSteps={appendSteps} />
    </div>
  )
}

const HeroStat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Receipt
  label: string
  value: string
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-sky-500" />
      <p className="text-muted-foreground text-xs font-semibold uppercase">{label}</p>
    </div>
    <p className="mt-2 text-sm font-bold">{value}</p>
  </div>
)
