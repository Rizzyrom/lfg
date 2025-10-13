import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { generateIdFromEntropySize } from 'lucia'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // Check if admin already exists
  const existingAdmin = await db.user.findFirst({
    where: {
      memberships: {
        some: {
          role: 'ADMIN',
        },
      },
    },
  })

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', existingAdmin.username)
    console.log('Generating new invite for existing admin...\n')

    // Get admin's group
    const membership = await db.membership.findFirst({
      where: {
        userId: existingAdmin.id,
        role: 'ADMIN',
      },
    })

    if (membership) {
      const inviteToken = generateIdFromEntropySize(32)
      const tokenHash = await hash(inviteToken)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await db.invite.create({
        data: {
          tokenHash,
          expiresAt,
          createdById: existingAdmin.id,
          groupId: membership.groupId,
        },
      })

      console.log('✅ New invite token generated!\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔑 INVITE TOKEN (save this - shown only once):')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`\n${inviteToken}\n`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Expires: ${expiresAt.toISOString()}\n`)
    }

    return
  }

  // Create admin user
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'

  const passwordHash = await hash(adminPassword)

  const admin = await db.user.create({
    data: {
      username: adminUsername,
      passwordHash,
    },
  })

  console.log('✅ Admin user created:', admin.username)

  // Create default group
  const group = await db.group.create({
    data: {
      nameEnc: 'Default Group', // In production, this would be encrypted
      createdById: admin.id,
    },
  })

  console.log('✅ Default group created:', group.id)

  // Add admin to group
  await db.membership.create({
    data: {
      userId: admin.id,
      groupId: group.id,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin membership created\n')

  // Generate invite token
  const inviteToken = generateIdFromEntropySize(32)
  const tokenHash = await hash(inviteToken)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

  await db.invite.create({
    data: {
      tokenHash,
      expiresAt,
      createdById: admin.id,
      groupId: group.id,
    },
  })

  console.log('✅ Invite token generated!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 ADMIN CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Username: ${adminUsername}`)
  console.log(`Password: ${adminPassword}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 INVITE TOKEN (save this - shown only once):')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n${inviteToken}\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Expires: ${expiresAt.toISOString()}\n`)
  console.log('⚠️  Change admin password after first login!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
