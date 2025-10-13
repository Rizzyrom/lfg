import { NextRequest, NextResponse } from 'next/server'
import { requireUser, verifyOrigin } from '@/lib/auth'
import { rateLimit } from '@/lib/redis'

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()

    const allowed = await rateLimit(`pulse:${user.id}`, 20, 3600)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json()
    const { headlines } = body

    if (!Array.isArray(headlines) || headlines.length === 0) {
      return NextResponse.json({ error: 'Headlines array required' }, { status: 400 })
    }

    // Use Anthropic if available, otherwise OpenAI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!anthropicKey && !openaiKey) {
      return NextResponse.json({
        summary: 'AI pulse not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.',
      })
    }

    const prompt = `Summarize these market headlines in 2-3 concise sentences:\n\n${headlines.join('\n')}`

    let summary = ''

    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 150,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        summary = data.content[0].text
      }
    } else if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 150,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        summary = data.choices[0].message.content
      }
    }

    return NextResponse.json({ summary: summary || 'Unable to generate summary' })
  } catch (error) {
    console.error('Pulse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
