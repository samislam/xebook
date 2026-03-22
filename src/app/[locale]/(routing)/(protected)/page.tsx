import { pageDefs } from '@/config/pages.config'
import { Link } from '@/lib/next-intl/navigation'
import { WandSparkles, BookOpenText } from 'lucide-react'

const Page = () => {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col justify-center">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Exchange ProfitBook</h1>
        <p className="text-muted-foreground mt-2 text-sm">Choose where you want to go.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={pageDefs.simulate.href}
          className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md"
        >
          <WandSparkles className="mb-8 h-10 w-10 text-blue-500 transition group-hover:scale-105" />
          <p className="text-xl font-bold">{pageDefs.simulate.title}</p>
        </Link>

        <Link
          href={pageDefs.tradebook.href}
          className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
        >
          <BookOpenText className="mb-8 h-10 w-10 text-emerald-500 transition group-hover:scale-105" />
          <p className="text-xl font-bold">{pageDefs.tradebook.title}</p>
        </Link>
      </div>
    </div>
  )
}
export default Page
