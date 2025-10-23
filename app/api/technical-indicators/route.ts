import { NextRequest, NextResponse } from 'next/server'
import { fetchCryptoChartData, fetchStockChartData, calculateTechnicalIndicators } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source')

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Fetch enough data for technical indicators (200+ data points)
    let chartData
    if (source === 'crypto') {
      chartData = await fetchCryptoChartData(symbol, 365) // 1 year of data
    } else {
      chartData = await fetchStockChartData(symbol, 'D', 365)
    }

    if (!chartData || chartData.length < 200) {
      return NextResponse.json(
        { error: 'Not enough data for technical analysis' },
        { status: 404 }
      )
    }

    const indicators = calculateTechnicalIndicators(chartData)

    if (!indicators) {
      return NextResponse.json(
        { error: 'Failed to calculate technical indicators' },
        { status: 500 }
      )
    }

    return NextResponse.json(indicators, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Technical indicators API error:', error)
    return NextResponse.json({ error: 'Failed to fetch technical indicators' }, { status: 500 })
  }
}
