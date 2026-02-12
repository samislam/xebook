const RIBBON_CONFIG = {
  staging: {
    label: 'STAGING',
    className: 'bg-yellow-300 text-black',
  },
  testing: {
    label: 'TESTING',
    className: 'bg-blue-500 text-white',
  },
  localhost: {
    label: 'LOCALHOST',
    className: 'bg-orange-500 text-white',
  },
} satisfies Record<'staging' | 'testing' | 'localhost', { label: string; className: string }>

export type EnvironmentRibbonProps = {
  environment?: 'production' | 'none' | keyof typeof RIBBON_CONFIG | null
}

export const EnvironmentRibbon = ({ environment }: EnvironmentRibbonProps) => {
  if (!environment || environment === 'production' || environment === 'none') return null

  const config = RIBBON_CONFIG[environment]

  if (!config) return null

  return (
    <div className="pointer-events-none fixed top-0 right-0 z-[9999] h-28 w-28 overflow-hidden">
      <div
        className={`absolute top-7 right-[-56px] rotate-45 px-12 py-1.5 text-center text-sm font-extrabold tracking-[0.3em] shadow-lg ${config.className}`}
      >
        {config.label}
      </div>
    </div>
  )
}
