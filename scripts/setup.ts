import chalk from 'chalk'
import { existsSync } from 'fs'
import { spawnSync } from 'node:child_process'

const run = (command: string) => {
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const possibleEnvFiles = [`.env.${nodeEnv}.local`, '.env.local', `.env.${nodeEnv}`, '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

if (dotenvFile) {
  console.log(chalk.cyanBright('Using environment file: '), chalk.bold.greenBright(dotenvFile))
  run(`dotenv -e ${dotenvFile} -- prisma migrate deploy`)
  run(`dotenv -e ${dotenvFile} -- prisma generate`)
} else if (process.env.DATABASE_URL) {
  console.log(chalk.cyanBright('Using DATABASE_URL from environment (no env file found)'))
  run('prisma migrate deploy')
  run('prisma generate')
} else {
  console.warn('No env file found and DATABASE_URL is not set. Please define one first!')
  process.exit(1)
}
