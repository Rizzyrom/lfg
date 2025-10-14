import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, verifyOrigin } from '@/lib/auth'

// GET - Fetch reactions for a message
export async function GET(request: NextRequest) {
  try {
    await requireUser()
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const reactions = await db.reaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    // Group reactions by emoji
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        }
      }
      acc[reaction.emoji].count++
      acc[reaction.emoji].users.push({
        id: reaction.user.id,
        username: reaction.user.username,
      })
      return acc
    }, {} as Record<string, { emoji: string; count: number; users: { id: string; username: string }[] }>)

    return NextResponse.json({
      success: true,
      reactions: Object.values(grouped),
    })
  } catch (error) {
    console.error('Reactions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add reaction
export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()
    const body = await request.json()
    const { messageId, emoji } = body

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: 'Message ID and emoji are required' },
        { status: 400 }
      )
    }

    // Check if reaction already exists (will be unique constraint)
    const existing = await db.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji,
        },
      },
    })

    if (existing) {
      // Already reacted, remove the reaction instead (toggle behavior)
      await db.reaction.delete({
        where: {
          id: existing.id,
        },
      })

      return NextResponse.json({
        success: true,
        action: 'removed',
      })
    }

    // Add new reaction
    const reaction = await db.reaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
    })

    return NextResponse.json({
      success: true,
      action: 'added',
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
      },
    })
  } catch (error) {
    console.error('Reaction add error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove reaction
export async function DELETE(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const reactionId = searchParams.get('reactionId')

    if (!reactionId) {
      return NextResponse.json({ error: 'Reaction ID required' }, { status: 400 })
    }

    // Ensure user owns this reaction
    await db.reaction.delete({
      where: {
        id: reactionId,
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reaction delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
