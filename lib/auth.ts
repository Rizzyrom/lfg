import { Lucia } from 'lucia'
import { PrismaAdapter } from '@lucia-auth/adapter-prisma'
import { db } from './db'
import { cookies } from 'next/headers'
import { cache } from 'react'

const adapter = new PrismaAdapter(db.session, db.user)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

interface DatabaseUserAttributes {
  username: string
}

export const getUser = cache(async () => {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null
  if (!sessionId) return null

  const { session, user } = await lucia.validateSession(sessionId)
  try {
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id)
      ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie()
      ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    }
  } catch {}

  return user
})

export const requireUser = async () => {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  // In production, allow requests from the same host
  if (host) {
    const expectedOrigin = process.env.NODE_ENV === 'production'
      ? `https://${host}`
      : `http://${host}`

    // Check origin header
    if (origin === expectedOrigin) {
      return true
    }

    // Check referer header
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
        if (refererOrigin === expectedOrigin) {
          return true
        }
      } catch {}
    }
  }

  // Fallback: check ALLOWED_ORIGINS env var if set
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
  if (allowedOrigins.length > 0) {
    if (origin && allowedOrigins.includes(origin)) {
      return true
    }
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
        if (allowedOrigins.includes(refererOrigin)) {
          return true
        }
      } catch {}
    }
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return false
}
