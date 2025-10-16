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
