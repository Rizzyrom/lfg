import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import webpush from 'web-push'

// Configure web-push with VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { title, body, url, groupId } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured - push notifications disabled')
      return NextResponse.json({
        success: false,
        error: 'Push notifications not configured'
      })
    }

    // Get all push subscriptions for users in this group (except the sender)
    const subscriptions = await db.$queryRaw<Array<{
      userId: string
      endpoint: string
      p256dh: string
      auth: string
    }>>`
      SELECT DISTINCT ps."userId", ps.endpoint, ps.p256dh, ps.auth
      FROM "PushSubscription" ps
      INNER JOIN "Membership" m ON ps."userId" = m."userId"
      WHERE m."groupId" = ${groupId}
      AND ps."userId" != ${user.id}
    `

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Send notifications to all subscriptions
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: url || '/chat',
      tag: 'lfg-chat',
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          return { success: true, userId: sub.userId }
        } catch (error: any) {
          console.error(`Failed to send push to ${sub.userId}:`, error.message)

          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.$executeRaw`
              DELETE FROM "PushSubscription"
              WHERE endpoint = ${sub.endpoint}
            `
          }

          return { success: false, userId: sub.userId, error: error.message }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    return NextResponse.json({
      success: true,
      sent: successful,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Failed to send push notifications' },
      { status: 500 }
    )
  }
}
