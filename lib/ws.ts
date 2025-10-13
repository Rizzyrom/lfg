import { redis } from './redis'
import { db } from './db'

export interface WSMessage {
  ciphertext: string
  mediaPtr?: string
  ts: number
  senderId?: string
  messageId?: string
}

export async function publishMessage(groupId: string, message: WSMessage) {
  await redis.publish(`group:${groupId}`, JSON.stringify(message))
}

export async function persistMessage(groupId: string, senderId: string, ciphertext: string, mediaPtr?: string) {
  const message = await db.message.create({
    data: {
      groupId,
      senderId,
      ciphertext,
      mediaPtr,
    },
  })
  return message
}

export async function getRecentMessages(groupId: string, limit = 50) {
  return await db.message.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })
}
