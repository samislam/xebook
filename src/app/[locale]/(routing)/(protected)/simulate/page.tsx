import { SimulateProvider } from './hooks/use-simulate'
import { AppTabs } from '@/app/[locale]/composables/app-tabs'
import { ResultsCard } from '@/app/[locale]/composables/results-card'
import { CalculateForm } from '@/app/[locale]/composables/calculate-form'

const SimulatePage = () => {
  return (
    <SimulateProvider>
      <div className="relative h-screen w-full p-4 pt-16">
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
