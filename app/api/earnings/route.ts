import { NextRequest, NextResponse } from 'next/server'
import { fetchEarningsCalendar } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 })
    }

    const nextEarnings = await fetchEarningsCalendar(symbol)

    return NextResponse.json({ nextEarnings }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    })
  } catch (error) {
    console.error('Earnings API error:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 500 })
  }
}
