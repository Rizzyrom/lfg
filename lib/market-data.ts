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

export async function fetchCryptoPrice(symbol: string): Promise<{ price: string; change24h: string } | null> {
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
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
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
      change24h: coinData.usd_24h_change?.toString() || '0'
    }
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error)
    return null
  }
}

export async function fetchStockPrice(symbol: string): Promise<{ price: string; change24h: string } | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY

    // Try Finnhub if API key is available
    if (apiKey) {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { next: { revalidate: 30 } } // Cache for 30 seconds
      )

      if (response.ok) {
        const data: StockQuote = await response.json()
        if (data.c && data.c !== 0) {
          return {
            price: data.c.toString(),
            change24h: data.dp?.toString() || '0'
          }
        }
      }
    }

    // Fallback to Yahoo Finance (no API key required)
    console.log(`Using Yahoo Finance fallback for ${symbol}`)
    const yahooResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 }
      }
    )

    if (yahooResponse.ok) {
      const yahooData = await yahooResponse.json()
      const quote = yahooData.chart?.result?.[0]
      const meta = quote?.meta
      const indicators = quote?.indicators?.quote?.[0]

      if (meta?.regularMarketPrice) {
        const currentPrice = meta.regularMarketPrice
        const previousClose = meta.previousClose || meta.chartPreviousClose
        const change24h = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0

        return {
          price: currentPrice.toString(),
          change24h: change24h.toFixed(2)
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
