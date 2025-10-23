import { NextRequest, NextResponse } from 'next/server'
import { fetchCryptoChartData, fetchStockChartData, type PriceData } from '@/lib/marketDataAPI'

export const runtime = 'edge'

// Generate mock data as fallback when APIs fail
function generateMockChartData(days: number, basePrice: number = 100): PriceData[] {
  const data: PriceData[] = []
  const now = Date.now()
  const interval = (days * 24 * 60 * 60 * 1000) / 100 // 100 data points

  let price = basePrice
  for (let i = 0; i < 100; i++) {
    const timestamp = now - (100 - i) * interval
    const volatility = price * 0.02 // 2% volatility
    const change = (Math.random() - 0.5) * volatility

    price = Math.max(price + change, price * 0.5) // Prevent going below 50% of price

    const open = price
    const close = price + (Math.random() - 0.5) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    const volume = Math.floor(Math.random() * 1000000) + 100000

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    })

    price = close
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source')
    const days = parseInt(searchParams.get('days') || '7')

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let chartData: PriceData[] | null = null
    try {
      if (source === 'crypto') {
        chartData = await fetchCryptoChartData(symbol, days)
      } else {
        chartData = await fetchStockChartData(symbol, 'D', days)
      }
    } catch (apiError) {
      console.error(`API error for ${symbol}:`, apiError)
    }

    // If API fails or returns empty data, use mock data
    if (!chartData || chartData.length === 0) {
      console.warn(`Using mock data for ${symbol} - API returned no data`)
      chartData = generateMockChartData(days, source === 'crypto' ? 50000 : 150)
    }

    return NextResponse.json(chartData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Chart API error:', error)
    // Return mock data even on complete failure
    const days = 7
    return NextResponse.json(generateMockChartData(days, 100), {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  }
}
