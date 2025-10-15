import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.FINNHUB_API_KEY

    // If no API key, use Yahoo Finance fallback (no key required)
    if (!apiKey) {
      console.log('FINNHUB_API_KEY not configured, using Yahoo Finance fallback')

      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 300 }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const results = (data.quotes || [])
            .filter((item: any) => item.quoteType === 'EQUITY')
            .slice(0, 10)
            .map((item: any) => ({
              symbol: item.symbol,
              name: item.longname || item.shortname || item.symbol,
              type: 'Stock',
              source: 'stock'
            }))

          return NextResponse.json({ results })
        }
      } catch (error) {
        console.error('Yahoo Finance fallback error:', error)
      }

      // If Yahoo Finance fails, return basic symbol match
      const upperQuery = query.toUpperCase()
      return NextResponse.json({
        results: [{
          symbol: upperQuery,
          name: upperQuery,
          type: 'Stock',
          source: 'stock'
        }]
      })
    }

    // Use Finnhub symbol lookup
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`,
      { next: { revalidate: 300 } }
    )

    if (!response.ok) {
      console.error('Finnhub search error:', response.status)
      return NextResponse.json({ error: 'Search failed' }, { status: response.status })
    }

    const data = await response.json()

    // Format results
    const results = (data.result || [])
      .slice(0, 10)
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
