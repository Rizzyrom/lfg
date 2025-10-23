import { NextRequest, NextResponse } from 'next/server'
import { fetchCryptoData, fetchStockData } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source')

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let marketData
    if (source === 'crypto') {
      marketData = await fetchCryptoData(symbol)
    } else {
      marketData = await fetchStockData(symbol)
    }

    if (!marketData) {
      return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 404 })
    }

    return NextResponse.json(marketData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Market data API error:', error)
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
  }
}
