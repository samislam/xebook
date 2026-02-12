import { to } from 'await-to-js'
import { PrismaClient } from '@/generated/prisma'
import { SeederFn } from '@/lib/prisma/run-seeders'

export const seedExample: SeederFn<PrismaClient> = async (prismaClient) => {
  const [err, res] = await to(
    prismaClient.$runCommandRaw({
      update: 'example',
      updates: [
        {
          q: { exampleCol: { $exists: false } },
          u: { $set: { exampleCol: 'value' } },
          multi: true,
        },
      ],
    })
  )

  if (err || res.ok !== 1) console.log('❌ Failed to run seeder example')
  else console.log(`🌱 successfully seeded example for ${res.nModified} old rows`)
}
