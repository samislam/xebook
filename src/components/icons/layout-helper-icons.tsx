'use client'

import { cn } from '@/lib/shadcn/utils'
import { ComponentProps } from 'react'
import { useLocale } from '@/hooks/use-locale'
import { ChevronLeft, ChevronLeftIcon, ChevronRightIcon, SendHorizonalIcon } from 'lucide-react'

export const ChevronBackIcon = (props: ComponentProps<typeof ChevronLeft>) => {
  const { dir } = useLocale()
  return dir === 'ltr' ? <ChevronLeftIcon {...props} /> : <ChevronRightIcon {...props} />
}

export const ChevronNextIcon = (props: ComponentProps<typeof ChevronLeft>) => {
  const { dir } = useLocale()
  return dir === 'ltr' ? <ChevronRightIcon {...props} /> : <ChevronLeftIcon {...props} />
}

export const SendIcon = (props: ComponentProps<typeof SendHorizonalIcon>) => {
  const { className, ...rest } = props
  return <SendHorizonalIcon className={cn(className, 'rtl:rotate-180')} {...rest} />
}
