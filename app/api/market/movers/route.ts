import { NextResponse } from 'next/server'

interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const TOP_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'V',
  'WMT', 'JNJ', 'MA', 'PG', 'UNH', 'HD', 'DIS', 'BAC', 'ADBE', 'CRM',
  'NFLX', 'COST', 'PEP', 'KO', 'ORCL', 'AMD', 'INTC', 'CSCO', 'VZ', 'PFE'
]

async function fetchRealMarketMovers(): Promise<{ gainers: MarketMover[], losers: MarketMover[] }> {
  if (!FINNHUB_API_KEY) {
    console.error('FINNHUB_API_KEY not configured')
    return { gainers: [], losers: [] }
  }

  try {
    // Fetch quotes for top stocks from Finnhub
    const quotes = await Promise.all(
      TOP_STOCKS.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } }
          )

          if (!res.ok) return null

          const data = await res.json()
          const price = data.c || 0
          const change = data.d || 0
          const changePercent = data.dp || 0

          if (price === 0) return null

          return {
            symbol,
            name: symbol, // Simplified, could fetch full name from another endpoint
            price,
            change,
            changePercent,
            volume: data.v || 0,
          }
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error)
          return null
        }
      })
    )

    const validQuotes = quotes.filter((q): q is MarketMover => q !== null)

    // Sort by changePercent
    const gainers = validQuotes
      .filter(q => q.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10)

    const losers = validQuotes
      .filter(q => q.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10)

    return { gainers, losers }
  } catch (error) {
    console.error('Failed to fetch market movers:', error)
    return { gainers: [], losers: [] }
  }
}

export async function GET() {
  try {
    const data = await fetchRealMarketMovers()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Market movers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market movers' },
      { status: 500 }
    )
  }
}
