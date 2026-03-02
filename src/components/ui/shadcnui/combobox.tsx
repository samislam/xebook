'use client'

import { Input } from './input'
import { Button } from './button'
import { useMemo, useState } from 'react'

export type ComboboxOption = {
  value: string
  label?: string
}

type ComboboxProps = {
  value: string
  options: ComboboxOption[]
  placeholder?: string
  emptyText?: string
  startAction?: React.ReactNode
  endAction?: React.ReactNode
  disabled?: boolean
  onValueChange: (value: string) => void
  renderOption?: (option: ComboboxOption) => React.ReactNode
}

export const Combobox = ({
  value,
  options,
  placeholder,
  emptyText = 'No options found',
  startAction,
  endAction,
  disabled = false,
  onValueChange,
  renderOption,
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => (option.label ?? option.value).toLowerCase().includes(q))
  }, [options, value])

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        startAction={startAction}
        disabled={disabled}
        onFocus={() => {
          if (disabled) return
          setIsOpen(true)
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120)
        }}
        onChange={(event) => {
          if (disabled) return
          onValueChange(event.target.value)
          setIsOpen(true)
        }}
        endAction={endAction}
      />
      {isOpen && !disabled && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-52 w-full overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md">
          {filteredOptions.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">{emptyText}</p>
          ) : (
            filteredOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start overflow-hidden px-2 py-1.5 text-left text-sm font-normal"
                onMouseDown={(event) => {
                  event.preventDefault()
                  onValueChange(option.value)
                  setIsOpen(false)
                }}
              >
                {renderOption ? renderOption(option) : (option.label ?? option.value)}
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
