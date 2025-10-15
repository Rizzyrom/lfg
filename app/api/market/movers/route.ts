import { NextResponse } from 'next/server'

interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

// Mock data for development
const MOCK_GAINERS: MarketMover[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.43, change: 45.23, changePercent: 5.45, volume: 45678900 },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 245.67, change: 12.34, changePercent: 5.29, volume: 123456789 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 178.90, change: 8.45, changePercent: 4.96, volume: 67890123 },
  { symbol: 'AAPL', name: 'Apple Inc', price: 189.45, change: 7.23, changePercent: 3.97, volume: 98765432 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 412.34, change: 14.56, changePercent: 3.66, volume: 34567890 },
  { symbol: 'BTC', name: 'Bitcoin', price: 67890.12, change: 2145.67, changePercent: 3.26, volume: 28934567000 },
  { symbol: 'META', name: 'Meta Platforms Inc', price: 498.76, change: 13.45, changePercent: 2.77, volume: 23456789 },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: 89.12, changePercent: 2.65, volume: 15678901000 },
]

const MOCK_LOSERS: MarketMover[] = [
  { symbol: 'COIN', name: 'Coinbase Global Inc', price: 187.65, change: -12.34, changePercent: -6.17, volume: 12345678 },
  { symbol: 'SNAP', name: 'Snap Inc', price: 12.34, change: -0.67, changePercent: -5.15, volume: 45678901 },
  { symbol: 'UBER', name: 'Uber Technologies Inc', price: 67.89, change: -3.21, changePercent: -4.51, volume: 34567890 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.087, change: -0.0038, changePercent: -4.18, volume: 2345678900 },
  { symbol: 'RIOT', name: 'Riot Platforms Inc', price: 11.23, change: -0.45, changePercent: -3.86, volume: 23456789 },
  { symbol: 'LCID', name: 'Lucid Group Inc', price: 3.45, change: -0.12, changePercent: -3.36, volume: 56789012 },
  { symbol: 'PLTR', name: 'Palantir Technologies', price: 23.45, change: -0.78, changePercent: -3.22, volume: 67890123 },
  { symbol: 'RIVN', name: 'Rivian Automotive Inc', price: 15.67, change: -0.48, changePercent: -2.97, volume: 45678901 },
]

async function fetchRealMarketMovers(): Promise<{ gainers: MarketMover[], losers: MarketMover[] }> {
  try {
    // Try to fetch real data from Alpha Vantage or similar free API
    // For now, return mock data with some randomization to simulate real market
    const randomize = (movers: MarketMover[]) => {
      return movers.map(mover => ({
        ...mover,
        price: mover.price * (1 + (Math.random() - 0.5) * 0.02),
        change: mover.change * (1 + (Math.random() - 0.5) * 0.1),
        changePercent: mover.changePercent * (1 + (Math.random() - 0.5) * 0.1),
        volume: Math.floor(mover.volume * (1 + (Math.random() - 0.5) * 0.2)),
      }))
    }

    return {
      gainers: randomize(MOCK_GAINERS).sort((a, b) => b.changePercent - a.changePercent).slice(0, 10),
      losers: randomize(MOCK_LOSERS).sort((a, b) => a.changePercent - b.changePercent).slice(0, 10),
    }
  } catch (error) {
    console.error('Failed to fetch market movers:', error)
    return { gainers: MOCK_GAINERS, losers: MOCK_LOSERS }
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
