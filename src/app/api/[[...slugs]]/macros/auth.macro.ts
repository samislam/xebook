import { Elysia, status } from 'elysia'
import { UNKNOWN_ERR } from '@/constants'

export const AuthMacro = new Elysia({ name: 'protected.macro' }).macro({
  auth: (policy?: AuthPolicy) => ({
    resolve: async ({}) => {
      if (!policy?.protected) return
      // you logic for protection and authorization ...
      const $USER = { name: 'example user' }
      return { $USER }
    },
    error: ({ error }) => {
      console.log(error)
      return status(500, { error: UNKNOWN_ERR })
    },
  }),
})

type AuthPolicy = { protected?: boolean }
