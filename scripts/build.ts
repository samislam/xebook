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

const possibleEnvFiles = ['.env.production.local', '.env.production', '.env.local', '.env']
const dotenvFile = possibleEnvFiles.find((file) => existsSync(file))

console.log(
  chalk.cyanBright('Using environment file: '),
  chalk.bold.greenBright(dotenvFile ?? 'None!')
)

if (dotenvFile) {
  run(`dotenv -e ${dotenvFile} -- next build`)
} else {
  run('next build')
}

console.log(chalk.bold.cyanBright.italic('~ Building scripts...'))
run('ts-patch -p ./scripts.tsconfig.json')
console.log(chalk.greenBright('✔ Building scripts completed'))
console.log(chalk.greenBright('✔ Building project succeeded!'))
