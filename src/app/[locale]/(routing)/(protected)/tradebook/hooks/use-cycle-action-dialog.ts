'use client'

import type { PendingCycleAction } from '../tradebook.types'
import { createTogglableWithStateStore } from '@/lib/stores/create-togglable-with-state-store'

export const useCycleActionDialogStore =
  createTogglableWithStateStore<Exclude<PendingCycleAction, null>>()
