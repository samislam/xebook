import { NextRequest } from 'next/server'
import createi18nMiddleware from 'next-intl/middleware'
import { middlewareStack, pipe } from 'nextjs-middleware-stack'
import { appRoutingDef } from './lib/next-intl/app-routing-def'

// const regExp = {
// Login/auth UI pages (optionally locale-prefixed), e.g. /auth/login or /en/auth/login
// publicRoutes: /^\/(?:[a-z]{2}\/)?auth(?:\/.*)?$/,
// application page routes (optionally locale-prefixed), e.g. /, /en/customers, /ar/settings
// protectedRoutes: /^\/(?:[a-z]{2}\/)?(?!auth(\/|$)).*/,
// }

export default middlewareStack<NextRequest>([
  // AUTH GATE (run on protected routes)
  // pipe(regExp.protectedRoutes, async (req) => {
  //   const auth_token = req.cookies.get(AUTH_COOKIE)?.value
  //   const validation = await validateTokens({ auth_token })
  //   if (!validation.isValid) {
  //     req.nextUrl.pathname = pageDefs.login.href
  //     return
  //   }
  //   //  protect pages based on user role
  //   const role = validation.authPayload.role
  //   if (isAllowedByHref(req.nextUrl.pathname, role)) return
  //   req.nextUrl.pathname = pageDefs.forbidden.href
  // }),
  // pipe(
  //   // If already authed, block access to login/public auth routes
  //   regExp.publicRoutes,
  //   async (req) => {
  //     const auth_token = req.cookies.get(AUTH_COOKIE)?.value
  //     const { isValid: isAuthenticated } = await validateTokens({ auth_token })
  //     if (!isAuthenticated) return
  //     else req.nextUrl.pathname = pageDefs.home.href
  //   }
  // ),
  // ... your other middlewares
  // i18n middleware last
  pipe(() => true, createi18nMiddleware(appRoutingDef)),
])

export const config = {
  matcher: [
    // Run middleware for page routes only (exclude API, internals, assets, and root static files)
    '/((?!api|_next|_diag|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest).*)',
  ],
}
