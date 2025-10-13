import { NextRequest, NextResponse } from 'next/server'
import { requireUser, verifyOrigin } from '@/lib/auth'
import { rateLimit } from '@/lib/redis'

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()

    const allowed = await rateLimit(`refresh:${user.id}`, 10, 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (!n8nUrl) {
      return NextResponse.json({ error: 'N8N webhook not configured' }, { status: 500 })
    }

    // Trigger n8n webhook
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      console.error('N8N webhook failed:', response.status, await response.text())
      return NextResponse.json({ error: 'Failed to trigger refresh' }, { status: 500 })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Market data refresh triggered',
      data,
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
