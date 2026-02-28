'use client'

import { Link, usePathname } from '@/lib/next-intl/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'

export const AppTabs = () => {
  const pathname = usePathname()
  const activeTab = pathname === '/tradebook' ? 'tradebook' : 'simulate'

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full max-w-sm grid-cols-2">
        <TabsTrigger value="simulate" asChild>
          <Link href="/">Simulate</Link>
        </TabsTrigger>
        <TabsTrigger value="tradebook" asChild>
          <Link href="/tradebook">Tradebook</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
