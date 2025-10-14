import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, verifyOrigin } from '@/lib/auth'

// GET - Fetch messages
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    // Get user's first group if not specified
    let targetGroupId = groupId
    if (!targetGroupId) {
      const membership = await db.membership.findFirst({
        where: { userId: user.id },
      })
      if (membership) {
        targetGroupId = membership.groupId
      }
    }

    if (!targetGroupId) {
      return NextResponse.json({ messages: [] })
    }

    // Fetch recent messages (last 100)
    const messages = await db.message.findMany({
      where: { groupId: targetGroupId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: {
          select: {
            username: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            ciphertext: true,
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
      messages: messages.reverse().map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        username: msg.sender.username,
        ciphertext: msg.ciphertext,
        mediaPtr: msg.mediaPtr,
        createdAt: msg.createdAt.toISOString(),
        reactions: msg.reactions,
        replyTo: msg.replyTo,
      })),
    })
  } catch (error) {
    console.error('Chat fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send message
export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()
    const body = await request.json()
    const { message, groupId, mediaPtr, replyToId } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user's first group if not specified
    let targetGroupId = groupId
    if (!targetGroupId) {
      const membership = await db.membership.findFirst({
        where: { userId: user.id },
      })
      if (!membership) {
        return NextResponse.json({ error: 'No group membership found' }, { status: 400 })
      }
      targetGroupId = membership.groupId
    }

    // Verify user is member of group
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: targetGroupId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Create message
    const newMessage = await db.message.create({
      data: {
        groupId: targetGroupId,
        senderId: user.id,
        ciphertext: message, // In production this would be encrypted client-side
        mediaPtr: mediaPtr || null,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        senderId: newMessage.senderId,
        username: newMessage.sender.username,
        ciphertext: newMessage.ciphertext,
        mediaPtr: newMessage.mediaPtr,
        createdAt: newMessage.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
