import { AppTabs } from '../../composables/app-tabs'
import { ResultsCard } from '../../composables/results-card'
import { SimulateProvider } from './providers/simulate-provider'
import { CalculateForm } from '../../composables/calculate-form'
import { ThemeSwitcher } from '@/components/common/theme-switcher'
import { LogoutIconButton } from '@/components/common/logout-icon-button'

const SimulatePage = () => {
  return (
    <SimulateProvider>
      <div className="relative h-screen w-full p-4 pt-16">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LogoutIconButton />
          <ThemeSwitcher />
        </div>
        <div className="mb-4 w-full">
          <AppTabs />
        </div>
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full lg:w-1/2">
            <CalculateForm />
          </div>
          <div className="w-full lg:w-1/2">
            <ResultsCard />
          </div>
        </div>
      </div>
    </SimulateProvider>
  )
}

export default SimulatePage
