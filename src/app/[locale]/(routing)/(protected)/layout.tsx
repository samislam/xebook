import { PropsWithChildren } from 'react'
import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { LogoutIconButton } from '@/components/common/logout-icon-button'

const Layout = (props: PropsWithChildren) => {
  const { children } = props
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <LogoutIconButton />
        <ThemeSwitcher />
      </div>
      <main className="relative min-w-0 flex-1 overflow-x-hidden p-4 pt-16">{children}</main>
    </div>
  )
}
export default Layout
