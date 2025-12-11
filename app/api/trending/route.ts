import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { cachedRequest } from '@/lib/cache'

interface TrendingItem {
  symbol: string
  name: string
  price: number
  change24h: number
  volume?: number
  marketCap?: number
  source: 'crypto' | 'stock'
}

interface TrendingResponse {
  success: boolean
  trending: TrendingItem[]
  topGainers: TrendingItem[]
  topLosers: TrendingItem[]
}

// Cache key for trending data
const TRENDING_CACHE_KEY = 'trending:v1'
const TRENDING_CACHE_TTL = 120 // 2 minutes

async function fetchTrendingData(): Promise<TrendingResponse> {
  const trendingItems: TrendingItem[] = []

  // Fetch trending cryptos from CoinGecko
  try {
    const cryptoResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=15&page=1&sparkline=false`,
      {
        headers: {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '',
        },
      }
    )

    if (cryptoResponse.ok) {
      const cryptoData = await cryptoResponse.json()
      cryptoData.forEach((coin: any) => {
        trendingItems.push({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h || 0,
          volume: coin.total_volume,
          marketCap: coin.market_cap,
          source: 'crypto',
        })
      })
    }
  } catch (error) {
    console.error('CoinGecko trending fetch error:', error)
  }

  // Fetch top stock gainers from Finnhub
  try {
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'NFLX', 'COIN']

    const stockPromises = stockSymbols.map(async (symbol) => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.c && data.c > 0) {
            return {
              symbol,
              name: symbol,
              price: data.c,
              change24h: data.dp || 0,
              source: 'stock' as const,
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err)
      }
      return null
    })

    const stockResults = await Promise.all(stockPromises)
    stockResults.forEach(stock => {
      if (stock) trendingItems.push(stock)
    })
  } catch (error) {
    console.error('Stock trending fetch error:', error)
  }

  // Sort by change24h descending (top gainers first)
  trendingItems.sort((a, b) => b.change24h - a.change24h)

  return {
    success: true,
    trending: trendingItems.slice(0, 20),
    topGainers: trendingItems.filter(item => item.change24h > 0).slice(0, 10),
    topLosers: trendingItems.filter(item => item.change24h < 0).slice(-10).reverse(),
  }
}

export async function GET() {
  try {
    await requireUser()

    // Use cached request with deduplication
    const data = await cachedRequest<TrendingResponse>(
      TRENDING_CACHE_KEY,
      TRENDING_CACHE_TTL,
      fetchTrendingData
    )

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Trending fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
