import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, verifyOrigin } from '@/lib/auth'
import { callOpenAI } from '@/lib/openai'
import { addTickersToWatchlist, trackTickerMentions } from '@/lib/tickers'
import { executeCommand } from '@/lib/commands/exec'

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

    // Check if this is a slash command
    if (message.trim().startsWith('/')) {
      const result = await executeCommand({
        groupId: targetGroupId,
        userId: user.id,
        raw: message.trim(),
      })

      // Create a system message with the command result
      const systemMessage = await db.message.create({
        data: {
          groupId: targetGroupId,
          senderId: user.id,
          ciphertext: `[System] ${result.message}${result.detail ? '\n' + result.detail : ''}`,
          mediaPtr: null,
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
          id: systemMessage.id,
          senderId: systemMessage.senderId,
          username: systemMessage.sender.username,
          ciphertext: systemMessage.ciphertext,
          mediaPtr: systemMessage.mediaPtr,
          createdAt: systemMessage.createdAt.toISOString(),
        },
      })
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

    // Track ticker mentions for ranking (fire and forget)
    trackTickerMentions(message, targetGroupId)
      .then(count => {
        if (count > 0) {
          console.log(`Tracked ${count} ticker mention(s)`)
        }
      })
      .catch(err => console.error('Failed to track ticker mentions:', err))

    // Auto-add tickers mentioned in message to watchlist (fire and forget)
    addTickersToWatchlist(message, targetGroupId, user.id)
      .then(result => {
        if (result.added > 0) {
          console.log(`Auto-added ${result.added} ticker(s) to watchlist: ${result.tickers.join(', ')}`)
        }
      })
      .catch(err => console.error('Failed to auto-add tickers:', err))

    // Check for @lfgent mention
    let agentMessage = null
    if (message.includes('@lfgent')) {
      // Extract question after @lfgent
      const question = message.replace(/@lfgent/gi, '').trim()

      if (question) {
        const aiResponse = await callOpenAI(question)

        if (aiResponse.success && aiResponse.message) {
          // Find or create LFG Agent user
          let agentUser = await db.user.findUnique({
            where: { username: 'LFG Agent' },
          })

          if (!agentUser) {
            // Create agent user (won't be used for login, just for messages)
            const { hash } = await import('@node-rs/argon2')
            const randomPassword = Math.random().toString(36)
            agentUser = await db.user.create({
              data: {
                username: 'LFG Agent',
                passwordHash: await hash(randomPassword),
              },
            })

            // Add agent to the group as BOT
            await db.membership.create({
              data: {
                userId: agentUser.id,
                groupId: targetGroupId,
                role: 'BOT',
              },
            })
          }

          // Create agent response message
          const agentResponse = await db.message.create({
            data: {
              groupId: targetGroupId,
              senderId: agentUser.id,
              ciphertext: aiResponse.message,
              replyToId: newMessage.id,
            },
            include: {
              sender: {
                select: {
                  username: true,
                },
              },
            },
          })

          agentMessage = {
            id: agentResponse.id,
            senderId: agentResponse.senderId,
            username: agentResponse.sender.username,
            ciphertext: agentResponse.ciphertext,
            mediaPtr: agentResponse.mediaPtr,
            createdAt: agentResponse.createdAt.toISOString(),
          }
        }
      }
    }

    // Check for feedback keywords (bugs/features)
    const feedbackKeywords = ['bug', 'issue', 'broken', 'not working', 'error', 'feature', 'add', 'want', 'need', 'should', 'fix', 'improve', 'suggestion']
    const messageLower = message.toLowerCase()
    const hasFeedback = feedbackKeywords.some(keyword => messageLower.includes(keyword))

    if (hasFeedback) {
      // Save to feedback file (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          username: user.username,
        }),
      }).catch(err => console.error('Failed to save feedback:', err))
    }

    // Send push notifications to other group members (fire and forget)
    const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${user.username} sent a message`,
        body: messagePreview,
        url: '/chat',
        groupId: targetGroupId,
      }),
    }).catch(err => console.error('Failed to send push notifications:', err))

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
      agentMessage,
    })
  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
