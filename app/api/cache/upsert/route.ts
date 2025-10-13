import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Decimal } from 'decimal.js'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-app-secret')
  const expectedSecret = process.env.APP_WEBHOOK_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 })
    }

    let updated = 0

    for (const item of items) {
      const { symbol, source, price, change24h } = item

      if (!symbol || !source || price === undefined) {
        continue
      }

      await db.priceCache.upsert({
        where: {
          symbol_source: {
            symbol,
            source,
          },
        },
        update: {
          price: new Decimal(price),
          change24h: change24h !== undefined ? new Decimal(change24h) : null,
          updatedAt: new Date(),
        },
        create: {
          symbol,
          source,
          price: new Decimal(price),
          change24h: change24h !== undefined ? new Decimal(change24h) : null,
        },
      })

      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('Cache upsert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
