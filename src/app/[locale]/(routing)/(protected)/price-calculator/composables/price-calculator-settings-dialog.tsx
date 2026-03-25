'use client'

import { useWatch, type Control } from 'react-hook-form'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { InputField } from '@/components/common/input-field'
import { NumberInput } from '@/components/common/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import type { PriceCalculatorValues } from '../price-calculator.schema'

const SELL_CURRENCIES = ['SYP', 'TRY', 'USD', 'USDT'] as const
const EXIT_MODES = [
  { value: 'PERCENT', label: 'By %' },
  { value: 'PRICE', label: 'By sell price' },
] as const

export const PriceCalculatorSettingsDialog = ({
  control,
  currentUsdtHoldings,
  onFillTargetUsdtAmount,
}: {
  control: Control<PriceCalculatorValues, unknown>
  currentUsdtHoldings: number
  onFillTargetUsdtAmount: () => void
}) => {
  const exitMode = useWatch({
    control,
    name: 'targetExitMode',
  })
  const targetSellCurrency = useWatch({
    control,
    name: 'targetSellCurrency',
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Settings2 className="mr-2 h-4 w-4" />
          Scenario settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scenario settings</DialogTitle>
          <DialogDescription>
            Global inputs for exchange reference rates and your target sell assumptions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 md:gap-x-5">
          <div className="space-y-4">
            <InputField
              control={control}
              name="scenarioName"
              label="Scenario name"
              render={(field) => (
                <input
                  {...field}
                  className="border-input flex h-10 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm"
                  placeholder="Example: March 25 cash + USD bridge"
                />
              )}
            />

            <InputField
              control={control}
              name="targetSellCurrency"
              label="Target sell currency"
              render={(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SELL_CURRENCIES.map((currency) => (
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
              name="targetExitMode"
              label="Exit mode"
              render={(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXIT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {exitMode === 'PRICE' ? (
              <InputField
                control={control}
                name="targetSellPricePerUsdt"
                label={`Exit price per USDT (${targetSellCurrency ?? 'SYP'})`}
                description="Example: 129.5"
                render={(field) => (
                  <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            ) : (
              <InputField
                control={control}
                name="targetProfitPercent"
                label="Target net profit %"
                render={(field) => (
                  <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            )}

            <InputField
              control={control}
              name="targetUsdtAmount"
              label="USDT amount to sell"
              description={`Current scenario holdings: ${currentUsdtHoldings.toLocaleString(
                'en-US',
                {
                  maximumFractionDigits: 4,
                  minimumFractionDigits: 0,
                }
              )} USDT.`}
              render={(field) => (
                <NumberInput
                  {...field}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  endAction={
                    <button
                      type="button"
                      onClick={onFillTargetUsdtAmount}
                      className="text-xs font-semibold text-sky-600 uppercase hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      Max
                    </button>
                  }
                />
              )}
            />
          </div>

          <div className="space-y-4">
            <InputField
              control={control}
              name="usdToSypRate"
              label="USD -> SYP market rate"
              render={(field) => (
                <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
              )}
            />

            <InputField
              control={control}
              name="usdToTryRate"
              label="USD -> TRY market rate"
              render={(field) => (
                <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
              )}
            />

            <InputField
              control={control}
              name="targetSellFeePercent"
              label="Sell fee %"
              render={(field) => (
                <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
              )}
            />

            <InputField
              control={control}
              name="targetSellFeeFixed"
              label="Sell fixed fee"
              render={(field) => (
                <NumberInput {...field} value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
