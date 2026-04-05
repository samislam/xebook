import path from 'path'
import { defineConfig } from 'orval'

const url = process.env.MAIN_API_URL
const swaggerPath = process.env.MAIN_API_SWAGGER_API_JSON_PATH

if (!url || !swaggerPath) {
  console.error(
    'MAIN_API_URL and MAIN_API_SWAGGER_API_JSON_PATH environment variables are required!'
  )
  process.exit(-1)
}

export default defineConfig({
  api: {
    input: path.join(url, swaggerPath),
    output: {
      target: './src/lib/main-api-sdk/client.ts',
      schemas: './src/lib/main-api-sdk/model',
      client: 'axios',
    },
  },
})
