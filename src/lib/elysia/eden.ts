import { treaty } from '@elysiajs/eden'
import type { app as App } from '@/app/api/[[...slugs]]/route'

const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

// `.api` enters the `/api` prefix from Elysia route config.
export const appApi = treaty<typeof App>(apiBaseUrl).api
