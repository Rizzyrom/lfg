import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { fetchMarketPrice } from '@/lib/market-data'

export async function GET() {
  try {
    const user = await requireUser()

    // Get user's watchlist items
    const memberships = await db.membership.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            watchlist: true,
          },
        },
      },
    })

    const items = memberships.flatMap((m) => m.group.watchlist)

    // Fetch real-time prices for each item
    const pricesWithData = await Promise.all(
      items.map(async (item) => {
        const priceData = await fetchMarketPrice(item.symbol, item.source)

        if (priceData) {
          // Update cache in database
          await db.priceCache.upsert({
            where: {
              symbol_source: {
                symbol: item.symbol,
                source: item.source,
              },
            },
            create: {
              symbol: item.symbol,
              source: item.source,
              price: priceData.price,
              change24h: priceData.change24h,
            },
            update: {
              price: priceData.price,
              change24h: priceData.change24h,
              updatedAt: new Date(),
            },
          })
        }

        return {
          id: item.id,
          symbol: item.symbol,
          source: item.source,
          tags: item.tags,
          price: priceData?.price || null,
          change24h: priceData?.change24h || null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      items: pricesWithData // Return all items, even without prices
    })
  } catch (error) {
    console.error('Watchlist prices fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
