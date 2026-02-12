import localFont from 'next/font/local'
import { PropsWithChildren } from 'react'
import { ThemeProvider } from 'next-themes'
import appConfig from '@/config/app.config'
import { getLocale } from 'next-intl/server'
import { clientEnv } from '@/server/client-env'
import { ClientPlugger } from './client-plugger'
import { AppLanguages } from '@/types/app.types'
import { pageDefs } from '@/config/pages.config'
import { NextIntlClientProvider } from 'next-intl'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { getStaticData } from '@/lib/tolgee/tolgee-shared'
import { TolgeeNextProvider } from '@/lib/tolgee/tolgee-client'
import { MetadataGenerateFn } from '@/lib/next/metadata-generator'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { EnvironmentRibbon } from '@/components/common/environment-ribbon'
import { TolgeeLoadingScreen } from '@/components/common/tolgee-loading-screen'
import { TanstackQueryProvider } from '@/lib/tanstack-query/tanstack-query-provider'
import './globals.css'

interface Props extends PropsWithChildren {
  params: Promise<{ locale: string }>
}

export default async function RootLayout(props: Props) {
  const { children } = props
  const locale = (await getLocale()) as AppLanguages // # your logic to fetch the specific user locale
  const locales = await getStaticData([appConfig.fallbackLanguage, locale])
  const fontClassname = locale === 'ar' ? cairo.className : geistSans.className

  return (
    <NextIntlClientProvider locale={locale}>
      <TolgeeNextProvider locale={locale} locales={locales}>
        <html dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} suppressHydrationWarning>
          <body className={`${fontClassname} antialiased`}>
            <ThemeProvider
              enableSystem
              attribute="class"
              disableTransitionOnChange
              defaultTheme={appConfig.defaultTheme}
            >
              <TanstackQueryProvider>
                <NuqsAdapter>
                  <EnvironmentRibbon environment={clientEnv.NEXT_PUBLIC_ENVIRONMENT} />
                  {children}
                  <ReactQueryDevtools initialIsOpen={false} />
                  <TolgeeLoadingScreen />
                  <ClientPlugger />
                </NuqsAdapter>
              </TanstackQueryProvider>
            </ThemeProvider>
          </body>
        </html>
      </TolgeeNextProvider>
    </NextIntlClientProvider>
  )
}

const cairo = localFont({
  variable: '--font-cairo',
  display: 'swap',
  src: [
    {
      path: './fonts/cairo/static/Cairo-ExtraLight.ttf',
      weight: '200',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/cairo/static/Cairo-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
})

const geistSans = localFont({
  src: './fonts/geist/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const generateMetadata: MetadataGenerateFn = pageDefs.home.meta
