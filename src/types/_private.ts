import { StrictDeepOmit } from 'ts-essentials'
import { CookieAttributes } from '../lib/next/next-cookie'
import { LocalePrefixMode, RoutingConfig } from 'next-intl/routing'

export type AppLocaleRoutingDef<L extends string> = StrictDeepOmit<
  RoutingConfig<
    readonly L[],
    LocalePrefixMode,
    never, // Pathnames<readonly L[]>, import from 'next-intl/routing'
    never // DomainsConfig<readonly L[]> import from 'next-intl/routing'
  >,
  { locales: true; defaultLocale: true; localeCookie: true }
> & { localeCookie: CookieAttributes }

export type MaybePromise<T> = T | Promise<T>
