import { Elysia, t } from 'elysia'
import { transactionService } from './transaction.service'
import { createCycleBodySchema } from './transaction.schemas'
import { createTransactionBodySchema } from './transaction.schemas'
import { cycleParamsSchema } from './transaction.schemas'
import { deleteCycleResponseSchema } from './transaction.schemas'
import { cycleResponseSchema } from './transaction.schemas'
import { listTransactionsResponseSchema } from './transaction.schemas'
import { listCyclesResponseSchema } from './transaction.schemas'
import { resetCycleResponseSchema } from './transaction.schemas'
import { transactionResponseSchema } from './transaction.schemas'
import { updateCycleBodySchema } from './transaction.schemas'

const errorResponseSchema = t.Object({
  error: t.String(),
})

export const transactionController = new Elysia({ prefix: '/transactions' })
  .get(
    '/cycles',
    async () => {
      return transactionService.listCycles()
    },
    {
      response: {
        200: listCyclesResponseSchema,
      },
    }
  )
  .post(
    '/cycles',
    async ({ body }) => {
      return transactionService.createCycle(body.name)
    },
    {
      body: createCycleBodySchema,
      response: {
        200: cycleResponseSchema,
      },
    }
  )
  .patch(
    '/cycles/:id',
    async ({ params, body, status }) => {
      try {
        return await transactionService.renameCycle(params.id, body.name)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to rename cycle'
        return status(400, { error: message })
      }
    },
    {
      params: cycleParamsSchema,
      body: updateCycleBodySchema,
      response: {
        200: cycleResponseSchema,
        400: errorResponseSchema,
      },
    }
  )
  .delete(
    '/cycles/:id',
    async ({ params, status }) => {
      try {
        return await transactionService.deleteCycle(params.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete cycle'
        return status(400, { error: message })
      }
    },
    {
      params: cycleParamsSchema,
      response: {
        200: deleteCycleResponseSchema,
        400: errorResponseSchema,
      },
    }
  )
  .post(
    '/cycles/:id/reset',
    async ({ params, status }) => {
      try {
        return await transactionService.resetCycle(params.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reset cycle'
        return status(400, { error: message })
      }
    },
    {
      params: cycleParamsSchema,
      response: {
        200: resetCycleResponseSchema,
        400: errorResponseSchema,
      },
    }
  )
  .get(
    '/',
    async () => {
      return transactionService.listTransactions()
    },
    {
      response: {
        200: listTransactionsResponseSchema,
      },
    }
  )
  .post(
    '/',
    async ({ body, status }) => {
      if (body.type === 'BUY' && body.transactionCurrency === 'USD' && !body.usdTryRateAtBuy) {
        return status(400, {
          error: 'For USD BUY transactions, usdTryRateAtBuy is required',
        })
      }
      if (body.type === 'SELL' && !body.amountReceived && !body.pricePerUnit) {
        return status(400, {
          error: 'For SELL transactions, amountReceived or pricePerUnit must be provided',
        })
      }

      return transactionService.createTransaction(body)
    },
    {
      body: createTransactionBodySchema,
      response: {
        200: transactionResponseSchema,
        400: errorResponseSchema,
      },
    }
  )
