import { TradebookHeader } from './composables/tradebook-header'
import { TradebookDialogs } from './composables/tradebook-dialogs'
import { TradebookMainContent } from './composables/tradebook-main-content'
import { TradebookPageProvider } from './providers/tradebook-page.provider'

const TradebookPage = () => {
  return (
    <TradebookPageProvider>
      <div className="relative min-h-full w-full min-w-0">
        <TradebookHeader />
        <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <TradebookDialogs />
          <TradebookMainContent />
        </div>
      </div>
    </TradebookPageProvider>
  )
}

export default TradebookPage
