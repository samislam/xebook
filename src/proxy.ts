import { NextRequest } from 'next/server'
import { AUTH_COOKIE } from './constants'
import { serverEnv } from './server/server-env'
import { pageDefs } from './config/pages.config'
import createi18nMiddleware from 'next-intl/middleware'
import { verifyAuthToken } from './lib/auth/auth-token'
import { middlewareStack, pipe } from 'nextjs-middleware-stack'
import { appRoutingDef } from './lib/next-intl/app-routing-def'

export default middlewareStack<NextRequest>([
  pipe(
    () => true,
    async (req) => {
      const jwtSecret = serverEnv.AUTH_JWT_SECRET
      const authToken = req.cookies.get(AUTH_COOKIE)?.value
      const authPayload =
        !!jwtSecret && !!authToken ? await verifyAuthToken(authToken, jwtSecret) : null
      const isAuthenticated = Boolean(authPayload?.sub)
      const isLoginPage = req.nextUrl.pathname === pageDefs.login.href

      if (!isAuthenticated && !isLoginPage) {
        req.nextUrl.pathname = pageDefs.login.href
        return
      }

      if (isAuthenticated && isLoginPage) {
        req.nextUrl.pathname = pageDefs.home.href
      }
    }
  ),
  // i18n middleware last
  pipe(() => true, createi18nMiddleware(appRoutingDef)),
])

export const config = {
  matcher: [
    // Run middleware for page routes only (exclude API, internals, assets, and root static files)
    '/((?!api|_next|_diag|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest).*)',
  ],
}
