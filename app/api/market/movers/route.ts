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

const STOCK_NAMES: Record<string, string> = {
  'AAPL': 'Apple Inc',
  'MSFT': 'Microsoft Corporation',
  'GOOGL': 'Alphabet Inc',
  'AMZN': 'Amazon.com Inc',
  'NVDA': 'NVIDIA Corporation',
  'META': 'Meta Platforms Inc',
  'TSLA': 'Tesla Inc',
  'JPM': 'JPMorgan Chase',
  'V': 'Visa Inc',
  'WMT': 'Walmart Inc',
  'JNJ': 'Johnson & Johnson',
  'MA': 'Mastercard Inc',
  'PG': 'Procter & Gamble',
  'UNH': 'UnitedHealth Group',
  'HD': 'Home Depot Inc',
  'DIS': 'Walt Disney Co',
  'BAC': 'Bank of America',
  'ADBE': 'Adobe Inc',
  'CRM': 'Salesforce Inc',
  'NFLX': 'Netflix Inc',
  'COST': 'Costco Wholesale',
  'PEP': 'PepsiCo Inc',
  'KO': 'Coca-Cola Co',
  'ORCL': 'Oracle Corporation',
  'AMD': 'Advanced Micro Devices',
  'INTC': 'Intel Corporation',
  'CSCO': 'Cisco Systems',
  'VZ': 'Verizon Communications',
  'PFE': 'Pfizer Inc',
}

const TOP_STOCKS = Object.keys(STOCK_NAMES)

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
            name: STOCK_NAMES[symbol] || symbol,
            price,
            change,
            changePercent,
            volume: 0, // Volume not available in quote endpoint
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
