import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { lucia, verifyOrigin } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { verify } from '@node-rs/argon2'
import { rateLimit } from '@/lib/redis'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const allowed = await rateLimit(`signup:${ip}`, 5, 3600)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { inviteToken, username, password } = body

    if (!inviteToken || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find all non-consumed invites and check token
    const invites = await db.invite.findMany({
      where: {
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    let validInvite = null
    for (const invite of invites) {
      const isValid = await verify(invite.tokenHash, inviteToken)
      if (isValid) {
        validInvite = invite
        break
      }
    }

    if (!validInvite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        username,
        passwordHash,
      },
    })

    // Consume invite
    await db.invite.update({
      where: { id: validInvite.id },
      data: { consumedAt: new Date() },
    })

    // Add user to group
    await db.membership.create({
      data: {
        userId: user.id,
        groupId: validInvite.groupId,
        role: 'MEMBER',
      },
    })

    // Create session
    const session = await lucia.createSession(user.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    return NextResponse.json({ success: true, username: user.username })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
