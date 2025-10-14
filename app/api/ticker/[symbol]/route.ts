import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    await requireUser()

    const { symbol } = await params
    const upperSymbol = symbol.toUpperCase()

    // Try to find price data from any source
    const priceData = await db.priceCache.findFirst({
      where: {
        symbol: upperSymbol,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    if (!priceData) {
      return NextResponse.json({
        success: false,
        error: 'Price data not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      price: {
        symbol: priceData.symbol,
        source: priceData.source,
        price: priceData.price.toString(),
        change24h: priceData.change24h?.toString() || null,
        updatedAt: priceData.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Ticker fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
