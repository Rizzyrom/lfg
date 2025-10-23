import { NextResponse } from 'next/server'
import { fetchFearGreedIndex } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET() {
  try {
    const fearGreed = await fetchFearGreedIndex()

    if (!fearGreed) {
      return NextResponse.json({ error: 'Failed to fetch Fear & Greed Index' }, { status: 404 })
    }

    return NextResponse.json(fearGreed, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Fear & Greed API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Fear & Greed Index' }, { status: 500 })
  }
}
