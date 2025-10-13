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

export async function fetchCryptoPrice(symbol: string): Promise<{ price: string; change24h: string } | null> {
  try {
    const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' :
                   symbol.toLowerCase() === 'eth' ? 'ethereum' :
                   symbol.toLowerCase() === 'sol' ? 'solana' :
                   symbol.toLowerCase() === 'avax' ? 'avalanche-2' :
                   symbol.toLowerCase() === 'link' ? 'chainlink' :
                   symbol.toLowerCase() === 'matic' ? 'matic-network' :
                   symbol.toLowerCase()

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '',
        },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    )

    if (!response.ok) {
      console.error(`CoinGecko API error for ${symbol}:`, response.status)
      return null
    }

    const data = await response.json()
    const coinData = data[coinId]

    if (!coinData) return null

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
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`,
      { next: { revalidate: 30 } } // Cache for 30 seconds
    )

    if (!response.ok) {
      console.error(`Finnhub API error for ${symbol}:`, response.status)
      return null
    }

    const data: StockQuote = await response.json()

    if (!data.c || data.c === 0) return null

    return {
      price: data.c.toString(),
      change24h: data.dp?.toString() || '0'
    }
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
