import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { CalculateForm } from '../composables/calculate-form'
import { ResultsCard } from '../composables/results-card'

const Page = async () => {
  return (
    <div className="relative min-h-screen p-4 pt-16">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full lg:max-w-2xl">
          <CalculateForm />
        </div>
        <div className="w-full lg:max-w-2xl">
          <ResultsCard />
        </div>
      </div>
    </div>
  )
}
export default Page
