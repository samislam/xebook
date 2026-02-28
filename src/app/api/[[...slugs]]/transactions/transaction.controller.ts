import { Elysia, t } from 'elysia'
import { transactionService } from './transaction.service'
import { createTransactionBodySchema } from './transaction.schemas'
import { listTransactionsResponseSchema } from './transaction.schemas'
import { transactionResponseSchema } from './transaction.schemas'

const errorResponseSchema = t.Object({
  error: t.String(),
})

export const transactionController = new Elysia({ prefix: '/transactions' })
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
