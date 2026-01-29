import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireUser()

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    // If a specific symbol is requested
    if (symbol) {
      const price = await db.priceCache.findFirst({
        where: { symbol: symbol.toUpperCase() },
      })

      if (price) {
        return NextResponse.json({
          success: true,
          symbol: price.symbol,
          source: price.source,
          price: price.price.toString(),
          change24h: price.change24h?.toString() || '0',
          updatedAt: price.updatedAt.toISOString(),
        })
      } else {
        // Symbol not in cache - return empty but successful
        return NextResponse.json({
          success: true,
          symbol: symbol.toUpperCase(),
          price: null,
          change24h: null,
        })
      }
    }

    // Return all prices
    const prices = await db.priceCache.findMany({
      orderBy: { symbol: 'asc' },
    })

    return NextResponse.json({
      success: true,
      prices: prices.map(p => ({
        symbol: p.symbol,
        source: p.source,
        price: p.price.toString(),
        change24h: p.change24h?.toString() || null,
        updatedAt: p.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Price cache error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
