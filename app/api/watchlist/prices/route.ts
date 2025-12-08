import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { fetchCryptoPricesBatch, fetchStockPricesBatch } from '@/lib/market-data'

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
    // Gracefully handle if TickerMention table doesn't exist yet
    const mentionMap = new Map<string, number>()
    try {
      const groupIds = memberships.map(m => m.groupId)
      const mentionCounts = await db.tickerMention.findMany({
        where: {
          groupId: { in: groupIds }
        }
      })

      // Create a map of mention counts by symbol+source+groupId
      mentionCounts.forEach(mention => {
        const key = `${mention.symbol}-${mention.source}-${mention.groupId}`
        mentionMap.set(key, mention.count)
      })
    } catch (mentionError) {
      console.log('Mention tracking not available yet:', mentionError)
      // Continue without mention counts - table may not exist yet
    }

    // Separate items by source for batch fetching
    const cryptoSymbols = [...new Set(items.filter(i => i.source === 'crypto').map(i => i.symbol))]
    const stockSymbols = [...new Set(items.filter(i => i.source === 'stock').map(i => i.symbol))]

    // Batch fetch prices - 2 API calls instead of N calls
    const [cryptoPrices, stockPrices] = await Promise.all([
      fetchCryptoPricesBatch(cryptoSymbols),
      fetchStockPricesBatch(stockSymbols)
    ])

    // Combine into a single price map
    const priceMap = new Map<string, { price: string; change24h: string; change30d: string }>()
    cryptoPrices.forEach((value, key) => priceMap.set(`${key}-crypto`, value))
    stockPrices.forEach((value, key) => priceMap.set(`${key}-stock`, value))

    // Batch update price cache in database (fire and forget for performance)
    const cacheUpdates = Array.from(priceMap.entries()).map(([key, priceData]) => {
      const [symbol, source] = key.split('-')
      return db.priceCache.upsert({
        where: { symbol_source: { symbol, source } },
        create: { symbol, source, price: priceData.price, change24h: priceData.change24h, change30d: priceData.change30d },
        update: { price: priceData.price, change24h: priceData.change24h, change30d: priceData.change30d, updatedAt: new Date() },
      })
    })

    // Fire and forget - don't wait for cache updates
    Promise.all(cacheUpdates).catch(err => console.error('Cache update error:', err))

    // Build response with prices
    const pricesWithData = items.map((item) => {
      const priceKey = `${item.symbol}-${item.source}`
      const priceData = priceMap.get(priceKey)

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
