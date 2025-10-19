import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireUser()
    const { query } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json({
        answer: 'Perplexity API key not configured. Please add PERPLEXITY_API_KEY to your environment variables.'
      })
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful financial market assistant. Provide concise, accurate information about stocks, crypto, and market trends. Include sources when available.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Perplexity API error:', error)
      return NextResponse.json({
        answer: 'Failed to get response from Perplexity. Please try again.'
      })
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || 'No answer available'

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Perplexity search error:', error)
    return NextResponse.json({
      answer: 'An error occurred while searching. Please try again.'
    }, { status: 500 })
  }
}
