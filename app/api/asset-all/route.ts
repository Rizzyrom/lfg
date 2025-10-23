import { NextRequest, NextResponse } from 'next/server'
import {
  fetchCryptoChartData,
  fetchStockChartData,
  fetchCryptoData,
  fetchStockData,
  fetchCryptoNews,
  fetchStockNews,
  calculateTechnicalIndicators,
  fetchFearGreedIndex,
  fetchAnalystRatings,
} from '@/lib/marketDataAPI'

export const runtime = 'edge'

/**
 * Combined API endpoint that fetches ALL asset data in one request
 * This dramatically reduces the number of HTTP requests and improves performance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source')
    const days = parseInt(searchParams.get('days') || '7')

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const isCrypto = source === 'crypto'

    // Fetch everything in parallel for maximum speed
    const [chartData, marketData, newsData, sentimentData] = await Promise.allSettled([
      // Chart data
      isCrypto ? fetchCryptoChartData(symbol, days) : fetchStockChartData(symbol, 'D', days),

      // Market data
      isCrypto ? fetchCryptoData(symbol) : fetchStockData(symbol),

      // News
      isCrypto ? fetchCryptoNews(symbol) : fetchStockNews(symbol),

      // Sentiment
      isCrypto ? fetchFearGreedIndex() : fetchAnalystRatings(symbol),
    ])

    // Calculate technical indicators from chart data
    let technicalIndicators = null
    if (chartData.status === 'fulfilled' && chartData.value && chartData.value.length >= 200) {
      technicalIndicators = calculateTechnicalIndicators(chartData.value)
    }

    const response = {
      chart: chartData.status === 'fulfilled' ? chartData.value : null,
      market: marketData.status === 'fulfilled' ? marketData.value : null,
      news: newsData.status === 'fulfilled' ? newsData.value : [],
      sentiment: sentimentData.status === 'fulfilled' ? sentimentData.value : null,
      technical: technicalIndicators,
    }

    return NextResponse.json(response, {
      headers: {
        // Aggressive caching for speed
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Combined asset API error:', error)
    return NextResponse.json({ error: 'Failed to fetch asset data' }, { status: 500 })
  }
}
