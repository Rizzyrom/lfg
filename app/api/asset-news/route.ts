import { NextRequest, NextResponse } from 'next/server'
import { fetchCryptoNews, fetchStockNews } from '@/lib/marketDataAPI'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source')

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let news
    if (source === 'crypto') {
      news = await fetchCryptoNews(symbol)
    } else {
      news = await fetchStockNews(symbol)
    }

    return NextResponse.json(news || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Asset news API error:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
