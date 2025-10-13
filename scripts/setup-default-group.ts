import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function main() {
  console.log('🌱 Setting up default group...')

  // Find ROM and TOM
  const rom = await prisma.user.findUnique({ where: { username: 'ROM' } })
  const tom = await prisma.user.findUnique({ where: { username: 'TOM' } })

  if (!rom || !tom) {
    console.error('❌ ROM or TOM users not found. Run create-rom-tom.ts first.')
    return
  }

  // Create default group
  let group
  try {
    group = await prisma.group.create({
      data: {
        nameEnc: 'LFG Community', // In production this would be encrypted
        createdById: rom.id,
      },
    })
    console.log('✅ Created group: LFG Community')
  } catch (error: any) {
    // Group already exists, find it
    group = await prisma.group.findFirst({
      where: { createdById: rom.id }
    })
    if (group) {
      console.log('⚠️  Group already exists')
    } else {
      throw error
    }
  }

  if (!group) {
    console.error('❌ Failed to create or find group')
    return
  }

  // Add ROM and TOM as members
  for (const user of [rom, tom]) {
    try {
      await prisma.membership.create({
        data: {
          userId: user.id,
          groupId: group.id,
          role: 'ADMIN',
        },
      })
      console.log(`✅ Added ${user.username} to group`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  ${user.username} already in group`)
      } else {
        throw error
      }
    }
  }

  console.log('\n✅ Setup complete! ROM and TOM can now chat.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
