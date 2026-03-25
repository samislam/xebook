import { Elysia } from 'elysia'
import { AUTH_COOKIE } from '@/constants'
import { AuthMacro } from '../macros/auth.macro'
import { authService } from '../auth/auth.service'
import { resourceErrorClassifier } from '../../utils/resource-error-classifier'
import { errorResponseSchema, resourceErrorResponses } from '../../utils/response-schemas'
import { priceCalculatorScenariosService } from './price-calculator-scenarios.service'
import {
  savePriceCalculatorScenarioBodySchema,
  savePriceCalculatorScenarioResponseSchema,
  scenarioIdParamsSchema,
  priceCalculatorScenarioResponseSchema,
  listPriceCalculatorScenariosResponseSchema,
  deletePriceCalculatorScenarioResponseSchema,
} from './price-calculator-scenarios.schemas'

const requireAuthUser = async (token: string | null | undefined) =>
  authService.getAuthenticatedUserFromToken(token)

export const priceCalculatorScenariosController = new Elysia({
  prefix: '/price-calculator-scenarios',
})
  .use(AuthMacro)
  .get(
    '/',
    async ({ cookie }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      return { data: await priceCalculatorScenariosService.list(user!.id) }
    },
    {
      auth: { protected: true },
      response: {
        200: listPriceCalculatorScenariosResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
      },
    }
  )
  .get(
    '/:id',
    async ({ cookie, params }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      return { data: await priceCalculatorScenariosService.get(user!.id, params.id) }
    },
    {
      auth: { protected: true },
      params: scenarioIdParamsSchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to load scenario'),
      response: {
        200: priceCalculatorScenarioResponseSchema,
        ...resourceErrorResponses,
      } as const,
    }
  )
  .post(
    '/',
    async ({ cookie, body }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      return {
        data: await priceCalculatorScenariosService.create(user!.id, body.name, body.values),
      }
    },
    {
      auth: { protected: true },
      body: savePriceCalculatorScenarioBodySchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to save scenario'),
      response: {
        200: savePriceCalculatorScenarioResponseSchema,
        ...resourceErrorResponses,
      } as const,
    }
  )
  .patch(
    '/:id',
    async ({ cookie, params, body }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      return {
        data: await priceCalculatorScenariosService.update(
          user!.id,
          params.id,
          body.name,
          body.values
        ),
      }
    },
    {
      auth: { protected: true },
      params: scenarioIdParamsSchema,
      body: savePriceCalculatorScenarioBodySchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to update scenario'),
      response: {
        200: savePriceCalculatorScenarioResponseSchema,
        ...resourceErrorResponses,
      } as const,
    }
  )
  .delete(
    '/:id',
    async ({ cookie, params }) => {
      const token = typeof cookie[AUTH_COOKIE].value === 'string' ? cookie[AUTH_COOKIE].value : null
      const user = await requireAuthUser(token)
      return {
        data: await priceCalculatorScenariosService.delete(user!.id, params.id),
      }
    },
    {
      auth: { protected: true },
      params: scenarioIdParamsSchema,
      error: ({ code, error }) => resourceErrorClassifier(code, error, 'Failed to delete scenario'),
      response: {
        200: deletePriceCalculatorScenarioResponseSchema,
        ...resourceErrorResponses,
      } as const,
    }
  )
