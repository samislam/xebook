import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'orval'

const url = process.env.MAIN_API_URL
const swaggerPath = process.env.MAIN_API_SWAGGER_API_JSON_PATH
const configDir = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.resolve(configDir, '../../../src/generated/main-api-sdk')

if (!url || !swaggerPath) {
  console.error(
    'MAIN_API_URL and MAIN_API_SWAGGER_API_JSON_PATH environment variables are required!'
  )
  process.exit(-1)
}

export default defineConfig({
  api: {
    input: new URL(swaggerPath, url).toString(),
    output: {
      target: `${outputDir}/client.ts`,
      schemas: `${outputDir}/model`,
      client: 'axios',
    },
  },
})
