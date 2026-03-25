import { Elysia } from 'elysia'
import { priceCalculatorScenariosController } from './price-calculator-scenarios.controller'

export const priceCalculatorScenariosModule = new Elysia({
  name: 'price-calculator-scenarios.module',
}).use(priceCalculatorScenariosController)
