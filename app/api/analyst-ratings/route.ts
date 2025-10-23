import { NextRequest, NextResponse } from 'next/server'
import { fetchAnalystRatings } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 })
    }

    const ratings = await fetchAnalystRatings(symbol)

    if (!ratings) {
      return NextResponse.json({ error: 'No analyst ratings available' }, { status: 404 })
    }

    return NextResponse.json(ratings, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    })
  } catch (error) {
    console.error('Analyst ratings API error:', error)
    return NextResponse.json({ error: 'Failed to fetch analyst ratings' }, { status: 500 })
  }
}
