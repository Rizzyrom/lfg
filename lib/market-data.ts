// Real-time market data fetching

interface CryptoPrice {
  id: string
  current_price: number
  price_change_percentage_24h: number
}

interface StockQuote {
  c: number // Current price
  d: number // Change
  dp: number // Percent change
}

// Crypto symbol to CoinGecko ID mapping
const cryptoIdMap: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'MATIC': 'matic-network',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'UNI': 'uniswap',
  'LTC': 'litecoin',
  'XRP': 'ripple',
  'BNB': 'binancecoin',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'TRX': 'tron',
  'VET': 'vechain',
  'ALGO': 'algorand',
  'FIL': 'filecoin',
  'AAVE': 'aave',
  'COMP': 'compound-governance-token',
  'MKR': 'maker',
  'SNX': 'havven',
  'CRV': 'curve-dao-token',
  'SUSHI': 'sushi',
  'YFI': 'yearn-finance',
  'BAT': 'basic-attention-token',
  'ZRX': '0x',
  'ENJ': 'enjincoin',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity',
  'GALA': 'gala',
  'APE': 'apecoin',
  'LDO': 'lido-dao',
  'IMX': 'immutable-x',
  'OP': 'optimism',
  'ARB': 'arbitrum',
}

async function findCoinId(symbol: string): Promise<string | null> {
  try {
    const symbolUpper = symbol.toUpperCase()

    // Check hardcoded map first for common coins (faster)
    if (cryptoIdMap[symbolUpper]) {
      return cryptoIdMap[symbolUpper]
    }

    // If not in map, search CoinGecko for the coin ID
    const headers: HeadersInit = {}
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY
    }

    const searchResponse = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
      { headers, next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!searchResponse.ok) {
      return null
    }

    const searchData = await searchResponse.json()
    const coins = searchData.coins || []

    // Find exact symbol match
    const exactMatch = coins.find((coin: any) =>
      coin.symbol.toLowerCase() === symbol.toLowerCase()
    )

    return exactMatch ? exactMatch.id : null
  } catch (error) {
    console.error(`Error finding coin ID for ${symbol}:`, error)
    return null
  }
}

export async function fetchCryptoPrice(symbol: string): Promise<{ price: string; change24h: string; change30d: string } | null> {
  try {
    const coinId = await findCoinId(symbol)

    if (!coinId) {
      console.log(`Could not find CoinGecko ID for ${symbol}`)
      return null
    }

    const headers: HeadersInit = {}
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_30d_change=true`,
      {
        headers,
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    )

    if (!response.ok) {
      console.error(`CoinGecko API error for ${symbol}:`, response.status)
      return null
    }

    const data = await response.json()
    const coinData = data[coinId]

    if (!coinData) {
      console.log(`No CoinGecko data for ${symbol} (coinId: ${coinId})`)
      return null
    }

    return {
      price: coinData.usd.toString(),
      change24h: coinData.usd_24h_change?.toString() || '0',
      change30d: coinData.usd_30d_change?.toString() || '0'
    }
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error)
    return null
  }
}

export async function fetchStockPrice(symbol: string): Promise<{ price: string; change24h: string; change30d: string } | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY

    // Use Yahoo Finance for comprehensive data (current price + 30-day history)
    console.log(`Fetching stock data for ${symbol}`)

    // Fetch current price and daily change
    const yahooCurrentResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 }
      }
    )

    // Fetch 30-day historical data
    const yahoo30dResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 } // Cache for 5 minutes (less frequent updates for historical data)
      }
    )

    if (yahooCurrentResponse.ok && yahoo30dResponse.ok) {
      const currentData = await yahooCurrentResponse.json()
      const historicalData = await yahoo30dResponse.json()

      const currentQuote = currentData.chart?.result?.[0]
      const currentMeta = currentQuote?.meta
      const historicalQuote = historicalData.chart?.result?.[0]

      if (currentMeta?.regularMarketPrice) {
        const currentPrice = currentMeta.regularMarketPrice
        const previousClose = currentMeta.previousClose || currentMeta.chartPreviousClose
        const change24h = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0

        // Calculate 30-day change
        let change30d = 0
        const closePrices = historicalQuote?.indicators?.quote?.[0]?.close
        if (closePrices && closePrices.length > 0) {
          // Get the first valid closing price from 30 days ago
          const price30dAgo = closePrices.find((p: number | null) => p !== null && p !== undefined)
          if (price30dAgo) {
            change30d = ((currentPrice - price30dAgo) / price30dAgo) * 100
          }
        }

        return {
          price: currentPrice.toString(),
          change24h: change24h.toFixed(2),
          change30d: change30d.toFixed(2)
        }
      }
    }

    // Fallback to Finnhub if Yahoo Finance fails (but without 30-day data)
    if (apiKey) {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { next: { revalidate: 30 } }
      )

      if (response.ok) {
        const data: StockQuote = await response.json()
        if (data.c && data.c !== 0) {
          return {
            price: data.c.toString(),
            change24h: data.dp?.toString() || '0',
            change30d: '0' // Finnhub doesn't provide 30-day change
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error)
    return null
  }
}

export async function fetchMarketPrice(symbol: string, source: string) {
  if (source === 'crypto') {
    return await fetchCryptoPrice(symbol)
  } else if (source === 'stock') {
    return await fetchStockPrice(symbol)
  }
  return null
}

// Batch fetch crypto prices - much more efficient than individual calls
export async function fetchCryptoPricesBatch(symbols: string[]): Promise<Map<string, { price: string; change24h: string; change30d: string }>> {
  const results = new Map<string, { price: string; change24h: string; change30d: string }>()

  if (symbols.length === 0) return results

  try {
    // Map symbols to CoinGecko IDs
    const symbolToIdMap = new Map<string, string>()
    const coinIds: string[] = []

    for (const symbol of symbols) {
      const symbolUpper = symbol.toUpperCase()
      const coinId = cryptoIdMap[symbolUpper]
      if (coinId) {
        symbolToIdMap.set(symbol, coinId)
        coinIds.push(coinId)
      }
    }

    if (coinIds.length === 0) return results

    const headers: HeadersInit = {}
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY
    }

    // Fetch all prices in one API call
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_30d_change=true`,
      {
        headers,
        next: { revalidate: 30 }
      }
    )

    if (!response.ok) {
      console.error('CoinGecko batch API error:', response.status)
      return results
    }

    const data = await response.json()

    // Map results back to symbols
    for (const [symbol, coinId] of symbolToIdMap) {
      const coinData = data[coinId]
      if (coinData) {
        results.set(symbol, {
          price: coinData.usd.toString(),
          change24h: coinData.usd_24h_change?.toString() || '0',
          change30d: coinData.usd_30d_change?.toString() || '0'
        })
      }
    }
  } catch (error) {
    console.error('Error batch fetching crypto prices:', error)
  }

  return results
}

// Batch fetch stock prices using Yahoo Finance
export async function fetchStockPricesBatch(symbols: string[]): Promise<Map<string, { price: string; change24h: string; change30d: string }>> {
  const results = new Map<string, { price: string; change24h: string; change30d: string }>()

  if (symbols.length === 0) return results

  try {
    // Yahoo Finance supports batch quotes
    const symbolsStr = symbols.join(',')

    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsStr)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 }
      }
    )

    if (!response.ok) {
      console.error('Yahoo Finance batch API error:', response.status)
      // Fall back to individual fetches
      const fetchPromises = symbols.map(async (symbol) => {
        const price = await fetchStockPrice(symbol)
        if (price) results.set(symbol, price)
      })
      await Promise.all(fetchPromises)
      return results
    }

    const data = await response.json()
    const quotes = data.quoteResponse?.result || []

    for (const quote of quotes) {
      if (quote.regularMarketPrice) {
        const previousClose = quote.regularMarketPreviousClose || quote.regularMarketPrice
        const change24h = previousClose ? ((quote.regularMarketPrice - previousClose) / previousClose) * 100 : 0

        // For 30d change, we'll use fiftyDayAverageChangePercent as approximation
        // or fallback to 0 (individual fetch would be needed for exact 30d)
        const change30d = quote.fiftyTwoWeekLowChangePercent ? quote.fiftyTwoWeekLowChangePercent / 4 : 0

        results.set(quote.symbol, {
          price: quote.regularMarketPrice.toString(),
          change24h: change24h.toFixed(2),
          change30d: change30d.toFixed(2)
        })
      }
    }
  } catch (error) {
    console.error('Error batch fetching stock prices:', error)
  }

  return results
}
