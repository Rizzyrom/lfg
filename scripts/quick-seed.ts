import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { generateIdFromEntropySize } from 'lucia'

const db = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
})

async function main() {
  console.log('🌱 Creating test user...\n')

  const username = 'testuser'
  const password = 'test123'

  const passwordHash = await hash(password)

  const admin = await db.user.create({
    data: {
      username,
      passwordHash,
    },
  })

  const group = await db.group.create({
    data: {
      nameEnc: 'Test Group',
      createdById: admin.id,
    },
  })

  await db.membership.create({
    data: {
      userId: admin.id,
      groupId: group.id,
      role: 'ADMIN',
    },
  })

  const inviteToken = generateIdFromEntropySize(32)
  const tokenHash = await hash(inviteToken)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await db.invite.create({
    data: {
      tokenHash,
      expiresAt,
      createdById: admin.id,
      groupId: group.id,
    },
  })

  console.log('✅ Test user created!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📱 LOGIN CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Username: ${username}`)
  console.log(`Password: ${password}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('🔗 Open: http://localhost:2000/login\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 INVITE TOKEN (for additional users):')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n${inviteToken}\n`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
