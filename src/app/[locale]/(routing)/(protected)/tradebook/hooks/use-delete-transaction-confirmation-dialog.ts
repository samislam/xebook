'use client'

import { createTogglableWithStateStore } from '@/lib/stores/create-togglable-with-state-store'

export const useDeleteTransactionConfirmationDialogStore = createTogglableWithStateStore<string>()
