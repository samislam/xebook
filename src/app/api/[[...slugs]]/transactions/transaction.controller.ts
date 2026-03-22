import { z } from 'zod'
import { Elysia } from 'elysia'
import { cycleParamsSchema } from './transaction.schemas'
import { transactionService } from './transaction.service'
import { cycleResponseSchema } from './transaction.schemas'
import { createCycleBodySchema } from './transaction.schemas'
import { updateCycleBodySchema } from './transaction.schemas'
import { transactionParamsSchema } from './transaction.schemas'
import { listCyclesResponseSchema } from './transaction.schemas'
import { resetCycleResponseSchema } from './transaction.schemas'
import { deleteCycleResponseSchema } from './transaction.schemas'
import { institutionResponseSchema } from './transaction.schemas'
import { createTransactionBodySchema } from './transaction.schemas'
import { updateTransactionBodySchema } from './transaction.schemas'
import { createInstitutionBodySchema } from './transaction.schemas'
import { institutionIconParamsSchema } from './transaction.schemas'
import { listTransactionsResponseSchema } from './transaction.schemas'
import { listInstitutionsResponseSchema } from './transaction.schemas'
import { createTransactionResponseSchema } from './transaction.schemas'
import { deleteTransactionResponseSchema } from './transaction.schemas'
import { updateTransactionResponseSchema } from './transaction.schemas'
import { undoLastTransactionResponseSchema } from './transaction.schemas'

const errorResponseSchema = z.object({
  error: z.string(),
})

export const transactionController = new Elysia({ prefix: '/transactions' })
  .get(
    '/institutions',
    async () => {
      return transactionService.listInstitutions()
    },
    {
      response: {
        200: listInstitutionsResponseSchema,
      },
    }
  )
  .post(
    '/institutions',
    async ({ body, status }) => {
      try {
        const icon = body.icon instanceof File ? body.icon : undefined
        return await transactionService.createInstitution(body.name, icon)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create institution'
        return status(400, { error: message })
      }
    },
    {
      body: createInstitutionBodySchema,
      response: {
        200: institutionResponseSchema,
        400: errorResponseSchema,
      },
    }
  )
  .get(
    '/institutions/icon/:fileName',
    async ({ params, status }) => {
      try {
        const icon = await transactionService.getInstitutionIcon(params.fileName)
        return new Response(icon.buffer, {
          headers: {
            'Content-Type': icon.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      } catch {
        return status(404, { error: 'Institution icon not found' })
      }
    },
    {
      params: institutionIconParamsSchema,
      response: {
        404: errorResponseSchema,
      },
    }
  )
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
  .patch(
    '/:id',
    async ({ params, body, status }) => {
      try {
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
        return await transactionService.updateTransaction(params.id, body)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update transaction'
        return status(400, { error: message })
      }
    },
    {
      params: transactionParamsSchema,
      body: updateTransactionBodySchema,
      response: {
        200: updateTransactionResponseSchema,
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
  .post(
    '/cycles/:id/undoLast',
    async ({ params, status }) => {
      try {
        return await transactionService.undoLastTransactionInCycle(params.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to undo last transaction'
        return status(400, { error: message })
      }
    },
    {
      params: cycleParamsSchema,
      response: {
        200: undoLastTransactionResponseSchema,
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
  .delete(
    '/:id',
    async ({ params, status }) => {
      try {
        return await transactionService.deleteTransaction(params.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete transaction'
        return status(400, { error: message })
      }
    },
    {
      params: transactionParamsSchema,
      response: {
        200: deleteTransactionResponseSchema,
        400: errorResponseSchema,
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
      if (body.type === 'CYCLE_SETTLEMENT' && body.fromCycle.trim() === body.toCycle.trim()) {
        return status(400, {
          error: 'Source and destination cycles must be different',
        })
      }

      return transactionService.createTransaction(body)
    },
    {
      body: createTransactionBodySchema,
      response: {
        200: createTransactionResponseSchema,
        400: errorResponseSchema,
      },
    }
  )
