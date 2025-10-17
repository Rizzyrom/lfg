import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { fetchMarketPrice } from '@/lib/market-data'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params

    // Get the watchlist item
    const item = await db.watchItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Verify user has access to this item's group
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: item.groupId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Fetch fresh price data
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
          change30d: priceData.change30d,
        },
        update: {
          price: priceData.price,
          change24h: priceData.change24h,
          change30d: priceData.change30d,
          updatedAt: new Date(),
        },
      })
    }

    // Get mention count for this item
    let mentionCount = 0
    try {
      const mention = await db.tickerMention.findUnique({
        where: {
          symbol_source_groupId: {
            symbol: item.symbol,
            source: item.source,
            groupId: item.groupId,
          },
        },
      })
      mentionCount = mention?.count || 0
    } catch (error) {
      // Mention tracking may not be available
    }

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        symbol: item.symbol,
        source: item.source,
        tags: item.tags,
        price: priceData?.price || null,
        change24h: priceData?.change24h || null,
        change30d: priceData?.change30d || null,
        mentionCount,
      },
    })
  } catch (error) {
    console.error('Individual price fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
