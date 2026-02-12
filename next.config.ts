import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'
import { sentryConfig } from '@/lib/sentry/sentry._next_.config'

const IMAGE_OPTIMIZATION = process.env.IMAGE_OPTIMIZATION

const withNextIntl = createNextIntlPlugin('./src/lib/next-intl/i18n-request.ts')

const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: IMAGE_OPTIMIZATION === 'no' ? false : true,
    remotePatterns: [],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
} satisfies NextConfig

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig)
