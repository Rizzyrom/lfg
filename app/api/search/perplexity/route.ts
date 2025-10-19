import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireUser()
    const { query } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

    if (!BRAVE_API_KEY) {
      return NextResponse.json({
        answer: 'Brave Search API key not configured. Please add BRAVE_SEARCH_API_KEY to your environment variables.',
        results: []
      })
    }

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Brave Search API error:', error)
      return NextResponse.json({
        answer: 'Failed to search. Please try again.',
        results: []
      })
    }

    const data = await response.json()
    const webResults = data.web?.results || []

    // Format results into a readable summary
    let answer = ''
    const results = webResults.slice(0, 5).map((result: any) => {
      answer += `**${result.title}**\n${result.description}\n\n`
      return {
        title: result.title,
        url: result.url,
        description: result.description,
      }
    })

    if (!answer) {
      answer = 'No results found for your query.'
    }

    return NextResponse.json({ answer: answer.trim(), results })
  } catch (error) {
    console.error('Brave search error:', error)
    return NextResponse.json({
      answer: 'An error occurred while searching. Please try again.',
      results: []
    }, { status: 500 })
  }
}
