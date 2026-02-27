import { MaybePromise } from '@/types/_private'
import { PropsWithChildren } from 'react'

export interface PageProps<
  T extends {
    Queries?: Record<string, string | string[] | undefined>
    Params?: Record<string, string | string[] | undefined>
  } = Record<string, string>,
> {
  searchParams: Promise<
    (T['Queries'] extends undefined ? Record<string, string> : T['Queries']) & {
      'coming-from'?: string
      [key: string]: string | string[] | undefined
    }
  >
  params: Promise<
    (T['Params'] extends undefined ? Record<string, string> : T['Params']) & {
      [key: string]: string | string[] | undefined
    }
  >
}

type Dict = Record<string, string | string[] | undefined>

export type LayoutProps<T extends { Params?: Dict } = {}> = PropsWithChildren<{
  params: MaybePromise<T['Params'] extends undefined ? Dict : T['Params']>
}>
