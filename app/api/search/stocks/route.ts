import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      console.error('FINNHUB_API_KEY not configured')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Use Finnhub symbol lookup
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (!response.ok) {
      console.error('Finnhub search error:', response.status)
      return NextResponse.json({ error: 'Search failed' }, { status: response.status })
    }

    const data = await response.json()

    // Format results
    const results = (data.result || [])
      .slice(0, 10) // Limit to 10 results
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.description || item.symbol,
        type: item.type || 'Stock',
        source: 'stock'
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Stock search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
