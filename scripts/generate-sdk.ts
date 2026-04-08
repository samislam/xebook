import chalk from 'chalk'
import { existsSync } from 'fs'
import { Orval } from '@clscripts/orval'
import { DotenvCli } from '@clscripts/dotenv-cli'
import { runCommand } from '@clscripts/cl-common'

const ORVAL_CONFIG_PATH = './src/lib/orval/orval.config.ts'

function main() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
  const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

  if (dotenvFile) {
    console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
    runCommand(
      new DotenvCli({
        envFile: dotenvFile,
        execute: new Orval({
          config: ORVAL_CONFIG_PATH,
        }).command,
      }).command
    )
    return
  }

  if (process.env.MAIN_API_URL && process.env.MAIN_API_SWAGGER_API_JSON_PATH) {
    console.log(
      chalk.cyanBright(
        'Using MAIN_API_URL and MAIN_API_SWAGGER_API_JSON_PATH from environment (no env file found)'
      )
    )
    runCommand(
      new Orval({
        config: ORVAL_CONFIG_PATH,
      }).command
    )
    return
  }

  console.error(
    'No env file found and MAIN_API_URL / MAIN_API_SWAGGER_API_JSON_PATH are not set. Please define one first!'
  )
  process.exit(-1)
}

main()
