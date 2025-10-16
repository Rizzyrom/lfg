import { db } from './db'

/**
 * Known cryptocurrency symbols for better categorization
 */
const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC',
  'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'XLM', 'ALGO', 'VET', 'ICP', 'FIL',
  'TRX', 'ETC', 'THETA', 'XMR', 'AAVE', 'EGLD', 'EOS', 'XTZ', 'HBAR', 'FTM',
  'ZEC', 'MANA', 'SAND', 'AXS', 'RUNE', 'KSM', 'NEO', 'WAVES', 'DASH', 'COMP'
])

/**
 * Extract ticker symbols from a message
 * Matches $SYMBOL pattern (e.g., $AAPL, $BTC, $META)
 */
export function extractTickers(message: string): string[] {
  const tickerRegex = /\$([A-Z]{1,5})\b/g
  const matches = message.match(tickerRegex)

  if (!matches) return []

  // Extract just the symbol (remove $)
  const tickers = matches.map(match => match.substring(1))

  // Return unique tickers
  return [...new Set(tickers)]
}

/**
 * Determine if a ticker is a stock or cryptocurrency
 */
export function getTickerSource(symbol: string): 'stock' | 'crypto' {
  return CRYPTO_SYMBOLS.has(symbol.toUpperCase()) ? 'crypto' : 'stock'
}

/**
 * Track ticker mentions for ranking
 * Increments mention count and updates lastMentionedAt timestamp
 */
export async function trackTickerMentions(
  message: string,
  groupId: string
): Promise<number> {
  const tickers = extractTickers(message)

  if (tickers.length === 0) {
    return 0
  }

  let trackedCount = 0

  for (const ticker of tickers) {
    try {
      const source = getTickerSource(ticker)
      const symbol = ticker.toUpperCase()

      // Upsert: increment count if exists, create new if doesn't
      await db.tickerMention.upsert({
        where: {
          symbol_source_groupId: {
            symbol,
            source,
            groupId,
          },
        },
        update: {
          count: {
            increment: 1,
          },
          lastMentionedAt: new Date(),
        },
        create: {
          symbol,
          source,
          groupId,
          count: 1,
          lastMentionedAt: new Date(),
        },
      })

      trackedCount++
      console.log(`Tracked mention for ${ticker} in group ${groupId}`)
    } catch (error) {
      console.error(`Failed to track mention for ${ticker}:`, error)
    }
  }

  return trackedCount
}

/**
 * Clean up mentions older than 21 days
 * Returns the number of records deleted
 */
export async function cleanupOldMentions(): Promise<number> {
  const twentyOneDaysAgo = new Date()
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

  try {
    const result = await db.tickerMention.deleteMany({
      where: {
        lastMentionedAt: {
          lt: twentyOneDaysAgo,
        },
      },
    })

    console.log(`Cleaned up ${result.count} old ticker mentions`)
    return result.count
  } catch (error) {
    console.error('Failed to clean up old mentions:', error)
    return 0
  }
}

/**
 * Add tickers from a message to the group's watchlist
 * Returns the number of tickers successfully added
 */
export async function addTickersToWatchlist(
  message: string,
  groupId: string,
  userId: string
): Promise<{ added: number; tickers: string[] }> {
  const tickers = extractTickers(message)

  if (tickers.length === 0) {
    return { added: 0, tickers: [] }
  }

  let addedCount = 0
  const addedTickers: string[] = []

  // Try to add each ticker
  for (const ticker of tickers) {
    try {
      const source = getTickerSource(ticker)

      await db.watchItem.create({
        data: {
          groupId,
          userId,
          symbol: ticker.toUpperCase(),
          source,
          tags: ['auto-added', 'from-chat'],
        },
      })

      addedCount++
      addedTickers.push(ticker)
      console.log(`Auto-added ticker ${ticker} to watchlist for group ${groupId}`)
    } catch (error: any) {
      // P2002 means the item already exists (unique constraint violation)
      if (error.code === 'P2002') {
        console.log(`Ticker ${ticker} already in watchlist for group ${groupId}`)
      } else {
        console.error(`Failed to auto-add ticker ${ticker}:`, error)
      }
    }
  }

  return { added: addedCount, tickers: addedTickers }
}
