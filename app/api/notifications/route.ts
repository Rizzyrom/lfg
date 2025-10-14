import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        message: {
          include: {
            sender: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        message: {
          id: n.message.id,
          ciphertext: n.message.ciphertext,
          sender: n.message.sender.username,
          createdAt: n.message.createdAt.toISOString(),
        },
      })),
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      await db.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      })

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    await db.notification.update({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
