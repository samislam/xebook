'use client'

import { createTogglableWithStateStore } from '@/lib/stores/create-togglable-with-state-store'

type InstitutionDialogTarget = 'sender' | 'recipient'

export const useCreateInstitutionDialogStore =
  createTogglableWithStateStore<InstitutionDialogTarget>()
