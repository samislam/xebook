'use client'

import { createTogglableWithStateStore } from '@/lib/stores/create-togglable-with-state-store'

export const useTransactionDetailsDialogStore = createTogglableWithStateStore<string>()
