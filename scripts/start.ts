import path from 'path'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import { runCommand } from '@clscripts/cl-common'

const possibleEnvFiles = [`.env.production.local`, `.env.production`, `.env.local`, `.env`]

const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

console.log(
  chalk.cyanBright('Using environment file: '),
  chalk.bold.greenBright(dotenvFile ?? 'None!')
)

// Load env directly — no shell, no dotenv-cli
if (dotenvFile) {
  loadEnv({ path: dotenvFile })
}

const nextPath = path.join(process.cwd(), 'node_modules', '.bin', 'next')
const commandToRun = `${nextPath} start`

runCommand(commandToRun)
