import chalk from 'chalk'
import { existsSync } from 'fs'
import { Prisma } from '@clscripts/prisma'
import { DotenvCli } from '@clscripts/dotenv-cli'
import { runCommandsSequentially } from '@clscripts/cl-common'

const nodeEnv = process.env.NODE_ENV ?? 'development'
const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))
if (dotenvFile) {
  console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
  runCommandsSequentially([
    new DotenvCli({
      envFile: dotenvFile,
      execute: new Prisma({
        mode: 'deploy',
      }).command,
    }).command,
    new DotenvCli({
      envFile: dotenvFile,
      execute: new Prisma({
        mode: 'generate',
      }).command,
    }).command,
  ])
} else if (process.env.DATABASE_URL) {
  console.log(chalk.cyanBright('Using DATABASE_URL from environment (no env file found)'))
  runCommandsSequentially([
    new Prisma({
      mode: 'deploy',
    }).command,
    new Prisma({
      mode: 'generate',
    }).command,
  ])
} else {
  console.error('No env file found and DATABASE_URL is not set. Please define one first!')
  process.exit(-1)
}
