import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.COINGECKO_API_KEY
    const headers: HeadersInit = {}
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey
    }

    // Use CoinGecko search endpoint to find any crypto
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        headers,
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      console.error('CoinGecko search error:', response.status)
      return NextResponse.json({ error: 'Search failed' }, { status: response.status })
    }

    const data = await response.json()

    // Format results from coins
    const results = (data.coins || [])
      .slice(0, 10) // Limit to 10 results
      .map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'Cryptocurrency',
        source: 'crypto',
        coinId: coin.id, // Store the CoinGecko ID for later price fetching
        thumb: coin.thumb || coin.large || coin.small // Image URL
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Crypto search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
