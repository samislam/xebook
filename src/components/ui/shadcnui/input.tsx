import * as React from 'react'
import { cn } from '@/lib/shadcn/utils'
import { type LibraryIcon, LibIcon } from '../samislam/lib-icon'

export type CustomInputProps = {
  icon?: LibraryIcon
  iconClassName?: string
  rootClassname?: string
  endAction?: React.ReactNode
  dir?: 'ltr' | 'rtl' | 'auto'
  startAction?: React.ReactNode
  iconPosition?: 'start' | 'end'
}
export type InputProps = React.ComponentProps<'input'> & CustomInputProps

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    type,
    icon,
    className,
    startAction,
    endAction,
    iconClassName,
    iconPosition = 'start',
    rootClassname,
    dir,
    onWheel,
    ...rest
  } = props

  const hasIcon = !!icon
  const hasAction = !!startAction || !!endAction
  const hasStartIcon = hasIcon && iconPosition === 'start'
  const hasEndIcon = hasIcon && iconPosition === 'end'
  const hasStartAction = hasAction && !!startAction
  const hasEndAction = hasAction && !!endAction
  const iconEl = hasIcon ? (
    <LibIcon icon={icon} className={cn('text-muted-foreground h-4 w-4', iconClassName)} />
  ) : null

  return (
    <div
      className={cn(
        // container styles
        'border-input flex h-10 w-full min-w-0 items-center rounded-md border px-3',
        'bg-white/80 shadow-sm transition-colors dark:bg-white/10',
        // react to child focus
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-2',
        // invalid state if the INPUT carries aria-invalid
        'aria-invalid:border-destructive focus-within:aria-invalid:ring-destructive/40',
        // disabled state if the INPUT is disabled (visual only)
        'disabled:cursor-not-allowed disabled:opacity-50',
        rootClassname
      )}
    >
      {hasStartIcon && <div className="ltr:pr-2 rtl:pl-2">{iconEl}</div>}
      {hasStartAction && <div className="ltr:pr-2 rtl:pl-2">{startAction}</div>}
      <input
        ref={ref}
        dir={dir}
        type={type}
        data-slot="input"
        onWheel={(event) => {
          if (type === 'number') {
            event.currentTarget.blur()
          }

          onWheel?.(event)
        }}
        className={cn(
          'm-0 h-full w-full appearance-none rounded-none border-0! p-0 shadow-none! outline-none',
          'text-base leading-none font-semibold',
          'placeholder:text-muted-foreground',
          'selection:bg-primary selection:text-primary-foreground',
          'focus-visible:ring-0 focus-visible:outline-none',
          // only matters for type='file'
          'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        {...rest}
      />
      {hasEndIcon && <div className="ltr:pl-2 rtl:pr-2">{iconEl}</div>}
      {hasEndAction && <div className="ltr:pl-2 rtl:pr-2">{endAction}</div>}
    </div>
  )
})

Input.displayName = 'Input'
export { Input }
