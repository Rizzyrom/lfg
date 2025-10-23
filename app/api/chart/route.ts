import { NextRequest, NextResponse } from 'next/server'
import { fetchCryptoChartData, fetchStockChartData } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source')
    const days = parseInt(searchParams.get('days') || '7')

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let chartData
    if (source === 'crypto') {
      chartData = await fetchCryptoChartData(symbol, days)
    } else {
      chartData = await fetchStockChartData(symbol, 'D', days)
    }

    if (!chartData || chartData.length === 0) {
      return NextResponse.json({ error: 'No chart data available' }, { status: 404 })
    }

    return NextResponse.json(chartData, {
      headers: {
        // Aggressive caching for performance
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Chart API error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
