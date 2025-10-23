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

    return NextResponse.json(chartData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Chart API error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
