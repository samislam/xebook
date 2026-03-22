import { PropsWithChildren } from 'react'
import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { LogoutIconButton } from '@/components/common/logout-icon-button'

const Layout = (props: PropsWithChildren) => {
  const { children } = props
  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex items-center gap-2">
        <LogoutIconButton />
        <ThemeSwitcher />
      </div>
      <main className="relative h-full w-full p-4 pt-16">{children}</main>
    </div>
  )
}
export default Layout
