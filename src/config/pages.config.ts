import { PagesDefs } from '@/types/pagedef.types'

export const pageDefs = {
  home: {
    href: '/',
    title: 'Home',
    description: 'Profit book Calculator home page',
    icon: 'mdi:mdiHome',
    async meta() {
      return {
        title: 'Exchange ProfitBook',
        description: 'Quickly Calculate profits of exchanges',
      }
    },
  },
  simulate: {
    href: '/simulate',
    title: 'Simulate',
    description: 'Simulation page',
    icon: 'mdi:mdiChartTimelineVariant',
  },
  priceCalculator: {
    href: '/price-calculator',
    title: 'Price calculator',
    description: 'Price calculator page',
    icon: 'mdi:mdiCalculatorVariant',
  },
  login: {
    href: '/login',
    title: 'Login',
    description: 'Login page',
    icon: 'mdi:mdiLock',
  },
  tradebook: {
    href: '/tradebook',
    title: 'Tradebook',
    description: 'Tradebook page',
    icon: 'mdi:mdiBookOpenVariant',
  },
} as const satisfies PagesDefs
