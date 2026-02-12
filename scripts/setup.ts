import chalk from 'chalk'
import { existsSync } from 'fs'
import { Prisma } from '@clscripts/prisma'
import { runCommand } from '@clscripts/cl-common'
import { DotenvCli } from '@clscripts/dotenv-cli'

const nodeEnv = process.env.NODE_ENV ?? 'development'
const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))
if (dotenvFile) {
  console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
  runCommand(
    new DotenvCli({
      envFile: dotenvFile,
      execute: new Prisma({
        mode: 'generate',
      }).command,
    }).command
  )
} else if (process.env.DATABASE_URL) {
  console.log(chalk.cyanBright('Using DATABASE_URL from environment (no env file found)'))
  runCommand(
    new Prisma({
      mode: 'generate',
    }).command
  )
} else {
  console.error('No env file found and DATABASE_URL is not set. Please define one first!')
  process.exit(-1)
}
