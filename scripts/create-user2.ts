import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@prisma/client'

const username = 'testuser2'
const password = 'test123'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function main() {
  console.log('🌱 Creating testuser2...')

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
    },
  })

  console.log('✅ User created:', username)
  console.log('   Password:', password)
  console.log('   User ID:', user.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
