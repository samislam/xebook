import type { PrismaClient } from '@/generated/prisma'
import { hashPassword } from '@/lib/auth/password'

export const seedRootUser = async (prisma: PrismaClient) => {
  const passwordHash = await hashPassword('root')

  await prisma.user.upsert({
    where: { username: 'root' },
    create: {
      username: 'root',
      name: 'root',
      passwordHash,
      isFrozen: false,
    },
    update: {
      name: 'root',
      passwordHash,
      isFrozen: false,
    },
  })

  console.log('Seeded root user')
}
