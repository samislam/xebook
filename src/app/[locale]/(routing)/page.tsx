import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { CalculateForm } from '../composables/calculate-form'

const Page = async () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <CalculateForm />
    </div>
  )
}
export default Page
