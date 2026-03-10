'use client'

import { pageDefs } from '@/config/pages.config'
import { Link, usePathname } from '@/lib/next-intl/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'

export const AppTabs = () => {
  const pathname = usePathname()
  const activeTab = pathname === pageDefs.tradebook.href ? 'tradebook' : 'simulate'

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="simulate" asChild>
          <Link href={pageDefs.simulate.href}>{pageDefs.simulate.title}</Link>
        </TabsTrigger>
        <TabsTrigger value="tradebook" asChild>
          <Link href={pageDefs.tradebook.href}>{pageDefs.tradebook.title}</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
