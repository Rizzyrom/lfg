import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function main() {
  console.log('🌱 Creating ROM and TOM users...')

  const password = 'test123'
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  // Create ROM
  try {
    const rom = await prisma.user.create({
      data: {
        username: 'ROM',
        passwordHash,
      },
    })
    console.log('✅ ROM created:', rom.id)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  ROM already exists')
    } else {
      throw error
    }
  }

  // Create TOM
  try {
    const tom = await prisma.user.create({
      data: {
        username: 'TOM',
        passwordHash,
      },
    })
    console.log('✅ TOM created:', tom.id)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  TOM already exists')
    } else {
      throw error
    }
  }

  console.log('\n📝 Login credentials:')
  console.log('   Username: ROM | Password: test123')
  console.log('   Username: TOM | Password: test123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
