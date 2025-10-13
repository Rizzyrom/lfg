// Standalone WebSocket server for chat
// Run separately: node lib/ws-server.js (after compilation)
// Or integrate with custom Next.js server

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { parse } from 'url'
import { redis } from './redis'
import { db } from './db'
import { lucia } from './auth'

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001

const server = createServer()
const wss = new WebSocketServer({ server })

interface Client {
  ws: WebSocket
  userId: string
  groupId: string
}

const clients = new Map<WebSocket, Client>()
const groupSubscriptions = new Map<string, Set<WebSocket>>()

wss.on('connection', async (ws, req) => {
  const { query } = parse(req.url || '', true)
  const sessionId = query.session as string
  const groupId = query.groupId as string

  if (!sessionId || !groupId) {
    ws.close(1008, 'Missing session or groupId')
    return
  }

  // Validate session
  try {
    const { user } = await lucia.validateSession(sessionId)
    if (!user) {
      ws.close(1008, 'Invalid session')
      return
    }

    // Verify user is member of group
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
    })

    if (!membership) {
      ws.close(1008, 'Not a member of this group')
      return
    }

    // Register client
    clients.set(ws, { ws, userId: user.id, groupId })

    if (!groupSubscriptions.has(groupId)) {
      groupSubscriptions.set(groupId, new Set())
    }
    groupSubscriptions.get(groupId)!.add(ws)

    // Subscribe to Redis channel (if Redis is available)
    const subscriber = redis ? redis.duplicate() : null
    const channel = `group:${groupId}`

    // Note: Upstash Redis REST API doesn't support pub/sub in the traditional sense
    // For production, use Upstash Redis with a different client or polling
    // This is a simplified implementation

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        const { ciphertext, mediaPtr, ts } = message

        if (!ciphertext) {
          ws.send(JSON.stringify({ error: 'Missing ciphertext' }))
          return
        }

        // Persist message
        const dbMessage = await db.message.create({
          data: {
            groupId,
            senderId: user.id,
            ciphertext,
            mediaPtr,
          },
        })

        // Broadcast to all clients in group
        const broadcastMessage = {
          messageId: dbMessage.id,
          senderId: user.id,
          username: user.username,
          ciphertext,
          mediaPtr,
          ts: dbMessage.createdAt.getTime(),
        }

        const broadcastData = JSON.stringify(broadcastMessage)
        const groupClients = groupSubscriptions.get(groupId)

        if (groupClients) {
          groupClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData)
            }
          })
        }

        // Also publish to Redis for other server instances
        await redis.set(`msg:${groupId}:latest`, broadcastData, { ex: 60 })
      } catch (error) {
        console.error('Message handling error:', error)
        ws.send(JSON.stringify({ error: 'Failed to process message' }))
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
      const groupClients = groupSubscriptions.get(groupId)
      if (groupClients) {
        groupClients.delete(ws)
        if (groupClients.size === 0) {
          groupSubscriptions.delete(groupId)
        }
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    // Send confirmation
    ws.send(JSON.stringify({ type: 'connected', groupId }))
  } catch (error) {
    console.error('Connection error:', error)
    ws.close(1011, 'Internal error')
  }
})

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})
