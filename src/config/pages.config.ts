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
  login: {
    href: '/login',
    title: 'Login',
    description: 'Login page',
    icon: 'mdi:mdiLock',
  },
} as const satisfies PagesDefs
