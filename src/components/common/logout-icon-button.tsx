'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { appApi } from '@/lib/elysia/eden'
import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { DialogTrigger } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import { useRouter } from '@/lib/next-intl/navigation'

export const LogoutIconButton = () => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onLogout = async () => {
    setIsSubmitting(true)
    try {
      await appApi.auth.logout.post()
    } finally {
      setIsSubmitting(false)
      setIsOpen(false)
      router.push('/login')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Logout</DialogTitle>
          <DialogDescription>Are you sure you want to logout?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void onLogout()} disabled={isSubmitting}>
            {isSubmitting ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
