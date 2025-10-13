import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    await requireUser()

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
