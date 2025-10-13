import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { lucia, verifyOrigin } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
import { rateLimit } from '@/lib/redis'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Check origin
    if (!verifyOrigin(request)) {
      console.error('Origin verification failed:', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host')
      })
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const allowed = await rateLimit(`login:${ip}`, 10, 900)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find user
    let user
    try {
      user = await db.user.findUnique({
        where: { username },
      })
    } catch (dbError) {
      console.error('Database error finding user:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    let validPassword
    try {
      validPassword = await verifyPassword(user.passwordHash, password)
    } catch (pwError) {
      console.error('Password verification error:', pwError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
    }

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create session
    let session
    try {
      session = await lucia.createSession(user.id, {})
    } catch (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json({ error: 'Session creation failed' }, { status: 500 })
    }

    // Set cookie
    try {
      const sessionCookie = lucia.createSessionCookie(session.id)
      ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    } catch (cookieError) {
      console.error('Cookie setting error:', cookieError)
      return NextResponse.json({ error: 'Session cookie error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, username: user.username })
  } catch (error) {
    console.error('Unexpected login error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
