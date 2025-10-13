import { NextRequest, NextResponse } from 'next/server'
import { lucia, verifyOrigin } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null
  if (!sessionId) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 })
  }

  await lucia.invalidateSession(sessionId)
  const sessionCookie = lucia.createBlankSessionCookie()
  ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  return NextResponse.json({ success: true })
}
