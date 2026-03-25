import { PrismaClient } from '@/generated/prisma'
import { runSeeders } from '@/lib/prisma/run-seeders'
import { seedRootUser } from './seeders/seed-root-user'

const prisma = new PrismaClient()
console.log('\n')

async function main() {
  await runSeeders(prisma, [seedRootUser])
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
