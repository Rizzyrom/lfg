import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, verifyOrigin } from '@/lib/auth'
import { hash } from '@node-rs/argon2'
import { rateLimit } from '@/lib/redis'
import { generateIdFromEntropySize } from 'lucia'

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const allowed = await rateLimit(`invite-create:${ip}`, 10, 3600)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Check if user is admin in any group
    const membership = await db.membership.findFirst({
      where: {
        userId: user.id,
        role: 'ADMIN',
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, expiresInDays = 7 } = body

    // Verify user is admin of this specific group
    const groupMembership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: groupId || membership.groupId,
        },
      },
    })

    if (!groupMembership || groupMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required for this group' }, { status: 403 })
    }

    // Generate invite token
    const inviteToken = generateIdFromEntropySize(32) // 256-bit random token
    const tokenHash = await hash(inviteToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    await db.invite.create({
      data: {
        tokenHash,
        expiresAt,
        createdById: user.id,
        groupId: groupId || membership.groupId,
      },
    })

    // Return token only once; store only hash
    return NextResponse.json({
      success: true,
      inviteToken, // Show this once to admin
      expiresAt,
    })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
