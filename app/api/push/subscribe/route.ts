import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { subscription } = await request.json()

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription provided' }, { status: 400 })
    }

    // Store push subscription in database
    // Note: You'll need to create a PushSubscription table in your schema
    await db.$executeRaw`
      INSERT INTO "PushSubscription" ("userId", "endpoint", "p256dh", "auth", "createdAt", "updatedAt")
      VALUES (
        ${user.id},
        ${subscription.endpoint},
        ${subscription.keys.p256dh},
        ${subscription.keys.auth},
        NOW(),
        NOW()
      )
      ON CONFLICT ("endpoint")
      DO UPDATE SET
        "userId" = ${user.id},
        "p256dh" = ${subscription.keys.p256dh},
        "auth" = ${subscription.keys.auth},
        "updatedAt" = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()
    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'No endpoint provided' }, { status: 400 })
    }

    // Remove push subscription
    await db.$executeRaw`
      DELETE FROM "PushSubscription"
      WHERE "userId" = ${user.id} AND "endpoint" = ${endpoint}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}
