import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './src/database/schema.prisma',
  migrations: {
    seed: 'bun ./src/database/seed.ts',
  },
})
