'use client'

import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/shadcnui/form'
import { Input } from '@/components/ui/shadcnui/input'
import { Toggle } from '@/components/ui/shadcnui/toggle'
import { Button } from '@/components/ui/shadcnui/button'
import { InputField } from '@/components/common/input-field'

type CalculateFormValues = {
  exchangeRate: string
  startingCapital: string
  buyCommission: string
  sellRate: string
  loopCount: string
  compoundProfits: boolean
}

export const CalculateForm = () => {
  const form = useForm<CalculateFormValues>({
    defaultValues: {
      exchangeRate: '43.39',
      startingCapital: '1000',
      buyCommission: '1',
      sellRate: '44.40',
      loopCount: '5',
      compoundProfits: true,
    },
  })

  const onSubmit = (values: CalculateFormValues) => {
    return values
  }

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <h1 className="mb-1 text-2xl font-bold">Exchange Loop Calculator</h1>
      <p className="text-muted-foreground mb-6 text-sm">Configure your loop values below.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
          <InputField
            control={form.control}
            name="exchangeRate"
            label="Exchange rate (TRY)"
            className="my-0"
            render={(field) => (
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.01"
                startAction={<span className="text-muted-foreground text-sm">₺</span>}
              />
            )}
          />

          <InputField
            control={form.control}
            name="startingCapital"
            label="Starting capital (USD)"
            className="my-0"
            render={(field) => (
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.01"
                startAction={<span className="text-muted-foreground text-sm">$</span>}
              />
            )}
          />

          <InputField
            control={form.control}
            name="buyCommission"
            label="Buy USDT commission (%)"
            className="my-0"
            render={(field) => (
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.01"
                startAction={<span className="text-muted-foreground text-sm">%</span>}
              />
            )}
          />

          <InputField
            control={form.control}
            name="sellRate"
            label="Sell full USDT for (TRY)"
            className="my-0"
            render={(field) => (
              <Input
                {...field}
                type="number"
                inputMode="decimal"
                step="0.01"
                startAction={<span className="text-muted-foreground text-sm">₺</span>}
              />
            )}
          />

          <InputField
            control={form.control}
            name="loopCount"
            label="Loop count"
            className="my-0"
            render={(field) => <Input {...field} type="number" min="1" step="1" />}
          />

          <InputField
            control={form.control}
            name="compoundProfits"
            label="Compound profits?"
            className="my-0"
            render={(field) => (
              <Toggle
                pressed={field.value}
                onPressedChange={field.onChange}
                variant="outline"
                className="w-full justify-center border-0 text-white data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:hover:bg-emerald-700 data-[state=off]:bg-red-600 data-[state=off]:text-white data-[state=off]:hover:bg-red-700"
              >
                {field.value ? 'Yes' : 'No'}
              </Toggle>
            )}
          />

          <div>
            <Button type="submit" className="w-full">
              Calculate
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}
