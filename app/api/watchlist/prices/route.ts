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

    // Fetch mention counts for each unique symbol/source combination across all groups
    const groupIds = memberships.map(m => m.groupId)
    const mentionCounts = await db.tickerMention.findMany({
      where: {
        groupId: { in: groupIds }
      }
    })

    // Create a map of mention counts by symbol+source+groupId
    const mentionMap = new Map<string, number>()
    mentionCounts.forEach(mention => {
      const key = `${mention.symbol}-${mention.source}-${mention.groupId}`
      mentionMap.set(key, mention.count)
    })

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
        const mentionKey = `${item.symbol}-${item.source}-${item.groupId}`
        const mentionCount = mentionMap.get(mentionKey) || 0

        return {
          id: item.id,
          symbol: item.symbol,
          source: item.source,
          tags: item.tags,
          price: priceData?.price || null,
          change24h: priceData?.change24h || null,
          change30d: priceData?.change30d || null,
          mentionCount,
        }
      })
    )

    // Sort by mention count (descending), then by symbol alphabetically
    const sortedItems = pricesWithData.sort((a, b) => {
      if (b.mentionCount !== a.mentionCount) {
        return b.mentionCount - a.mentionCount
      }
      return a.symbol.localeCompare(b.symbol)
    })

    return NextResponse.json({
      success: true,
      items: sortedItems // Return all items, sorted by mention count
    })
  } catch (error) {
    console.error('Watchlist prices fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
