/**
 * Market Data API Utilities
 * Fetches real data from multiple sources with automatic fallbacks
 */

// API endpoints
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const FEAR_GREED_API = 'https://api.alternative.me/fng/';

// Types
export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  ath?: number;
  athDate?: string;
  atl?: number;
  atlDate?: string;
  high52w?: number;
  low52w?: number;
  // Additional Robinhood-style metrics
  high24h?: number;
  low24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  priceChange1y?: number;
  fullyDilutedValuation?: number;
  // Stock-specific metrics
  peRatio?: number;
  eps?: number;
  beta?: number;
  dividendYield?: number;
  avgVolume?: number;
  previousClose?: number;
  openPrice?: number;
  bid?: number;
  ask?: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  movingAverages: {
    ma20: number;
    ma50: number;
    ma200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volumeAverage: number;
  support?: number;
  resistance?: number;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  image?: string;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

// Helper to check if API key exists in environment
const hasAPIKey = (key: string): boolean => {
  return typeof process !== 'undefined' && !!process.env[key];
};

/**
 * Fetch crypto data from CoinGecko (free, no auth required)
 */
export async function fetchCryptoData(symbol: string): Promise<MarketData | null> {
  try {
    const coinId = symbol.toLowerCase();
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) {
      // Try searching for the coin if direct fetch fails
      const searchRes = await fetch(`${COINGECKO_BASE}/search?query=${symbol}`);
      const searchData = await searchRes.json();

      if (searchData.coins && searchData.coins.length > 0) {
        const correctId = searchData.coins[0].id;
        const retryRes = await fetch(
          `${COINGECKO_BASE}/coins/${correctId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
          { next: { revalidate: 30 } }
        );

        if (!retryRes.ok) return null;
        const data = await retryRes.json();
        return parseCoinGeckoData(data);
      }
      return null;
    }

    const data = await response.json();
    return parseCoinGeckoData(data);
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return null;
  }
}

function parseCoinGeckoData(data: any): MarketData {
  const marketData = data.market_data;
  return {
    price: marketData.current_price?.usd || 0,
    change24h: marketData.price_change_percentage_24h || 0,
    marketCap: marketData.market_cap?.usd,
    volume24h: marketData.total_volume?.usd,
    circulatingSupply: marketData.circulating_supply,
    totalSupply: marketData.total_supply,
    ath: marketData.ath?.usd,
    athDate: marketData.ath_date?.usd,
    atl: marketData.atl?.usd,
    atlDate: marketData.atl_date?.usd,
    // Use ATH/ATL as fallback for 52w if no specific 52w data available
    // CoinGecko doesn't provide explicit 52-week, but provides price_change_percentage data
    high52w: marketData.ath?.usd, // ATH is a better proxy than 24h high
    low52w: marketData.atl?.usd,  // ATL is a better proxy than 24h low
    // Additional metrics for Robinhood-style display
    high24h: marketData.high_24h?.usd,
    low24h: marketData.low_24h?.usd,
    priceChange7d: marketData.price_change_percentage_7d,
    priceChange30d: marketData.price_change_percentage_30d,
    priceChange1y: marketData.price_change_percentage_1y,
    fullyDilutedValuation: marketData.fully_diluted_valuation?.usd,
  };
}

/**
 * Fetch stock data from Finnhub (requires API key) with Yahoo Finance fallback
 */
export async function fetchStockData(symbol: string): Promise<MarketData | null> {
  const apiKey = process.env.FINNHUB_API_KEY;

  // Try Finnhub first if API key is available
  if (apiKey) {
    try {
      // Fetch current quote
      const quoteRes = await fetch(
        `${FINNHUB_BASE}/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`,
        { next: { revalidate: 30 } }
      );

      if (quoteRes.ok) {
        const quote = await quoteRes.json();

        // Fetch company profile for additional data
        const profileRes = await fetch(
          `${FINNHUB_BASE}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${apiKey}`,
          { next: { revalidate: 3600 } }
        );

        let marketCap;
        if (profileRes.ok) {
          const profile = await profileRes.json();
          marketCap = profile.marketCapitalization;
        }

        return {
          price: quote.c || 0,
          change24h: quote.dp || 0,
          marketCap,
          high52w: quote.h,
          low52w: quote.l,
        };
      }
    } catch (error) {
      console.error('Finnhub API error, falling back to Yahoo Finance:', error);
    }
  }

  // Fallback to Yahoo Finance (free, no API key)
  try {
    // Use v7/finance/quote for comprehensive data including P/E, EPS, etc.
    const quoteResponse = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol.toUpperCase()}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 }
      }
    );

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      const quote = quoteData.quoteResponse?.result?.[0];

      if (quote) {
        return {
          price: quote.regularMarketPrice || 0,
          change24h: quote.regularMarketChangePercent || 0,
          marketCap: quote.marketCap,
          volume24h: quote.regularMarketVolume,
          high52w: quote.fiftyTwoWeekHigh,
          low52w: quote.fiftyTwoWeekLow,
          high24h: quote.regularMarketDayHigh,
          low24h: quote.regularMarketDayLow,
          previousClose: quote.regularMarketPreviousClose,
          openPrice: quote.regularMarketOpen,
          // Robinhood-style metrics
          peRatio: quote.trailingPE,
          eps: quote.epsTrailingTwelveMonths,
          beta: quote.beta,
          dividendYield: quote.dividendYield ? quote.dividendYield * 100 : undefined,
          avgVolume: quote.averageDailyVolume10Day,
          bid: quote.bid,
          ask: quote.ask,
        };
      }
    }

    // Fallback to chart API if quote API fails
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1y`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    if (!meta || !quote) return null;

    const prices = quote.close || [];
    const validPrices = prices.filter((p: number) => p != null);

    const high52w = Math.max(...validPrices);
    const low52w = Math.min(...validPrices);
    const currentPrice = meta.regularMarketPrice || validPrices[validPrices.length - 1] || 0;
    const previousClose = meta.chartPreviousClose || validPrices[validPrices.length - 2] || currentPrice;
    const change24h = ((currentPrice - previousClose) / previousClose) * 100;

    return {
      price: currentPrice,
      change24h,
      marketCap: meta.marketCap,
      high52w,
      low52w,
    };
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return null;
  }
}

/**
 * Fetch historical price data for charts
 */
export async function fetchCryptoChartData(
  symbol: string,
  days: number = 7
): Promise<PriceData[]> {
  try {
    const coinId = symbol.toLowerCase();
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      // Try search and retry
      const searchRes = await fetch(`${COINGECKO_BASE}/search?query=${symbol}`);
      const searchData = await searchRes.json();

      if (searchData.coins && searchData.coins.length > 0) {
        const correctId = searchData.coins[0].id;
        const retryRes = await fetch(
          `${COINGECKO_BASE}/coins/${correctId}/ohlc?vs_currency=usd&days=${days}`,
          { next: { revalidate: 60 } }
        );

        if (!retryRes.ok) return [];
        const data = await retryRes.json();
        return parseOHLCData(data);
      }
      return [];
    }

    const data = await response.json();
    return parseOHLCData(data);
  } catch (error) {
    console.error('Chart data fetch error:', error);
    return [];
  }
}

function parseOHLCData(data: any[]): PriceData[] {
  return data.map((candle) => ({
    timestamp: candle[0],
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5] || 0,
  }));
}

/**
 * Fetch stock chart data from Finnhub with Yahoo Finance fallback
 */
export async function fetchStockChartData(
  symbol: string,
  resolution: 'D' | '60' | '30' = 'D',
  days: number = 7
): Promise<PriceData[]> {
  const apiKey = process.env.FINNHUB_API_KEY;

  // Try Finnhub first if API key is available
  if (apiKey) {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - days * 24 * 60 * 60;

      const response = await fetch(
        `${FINNHUB_BASE}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`,
        { next: { revalidate: 60 } }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.s === 'ok') {
          return data.t.map((timestamp: number, index: number) => ({
            timestamp: timestamp * 1000,
            open: data.o[index],
            high: data.h[index],
            low: data.l[index],
            close: data.c[index],
            volume: data.v[index],
          }));
        }
      }
    } catch (error) {
      console.error('Finnhub chart data error, falling back to Yahoo Finance:', error);
    }
  }

  // Fallback to Yahoo Finance (free, no API key)
  try {
    const range = days <= 7 ? '7d' : days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 365 ? '1y' : '5y';
    const interval = days <= 7 ? '1h' : '1d';

    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=${interval}&range=${range}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) return [];

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];

    if (!quote) return [];

    return timestamps.map((timestamp: number, index: number) => ({
      timestamp: timestamp * 1000,
      open: quote.open?.[index] || quote.close?.[index] || 0,
      high: quote.high?.[index] || quote.close?.[index] || 0,
      low: quote.low?.[index] || quote.close?.[index] || 0,
      close: quote.close?.[index] || 0,
      volume: quote.volume?.[index] || 0,
    })).filter((d: PriceData) => d.close > 0);
  } catch (error) {
    console.error('Yahoo Finance chart data error:', error);
    return [];
  }
}

/**
 * Calculate technical indicators from price data
 */
export function calculateTechnicalIndicators(priceData: PriceData[]): TechnicalIndicators | null {
  if (priceData.length < 200) return null;

  const closes = priceData.map((d) => d.close);
  const volumes = priceData.map((d) => d.volume);

  // RSI (14-period)
  const rsi = calculateRSI(closes, 14);

  // MACD
  const macd = calculateMACD(closes);

  // Moving Averages
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const ma200 = calculateSMA(closes, 200);

  // Bollinger Bands
  const bollingerBands = calculateBollingerBands(closes, 20, 2);

  // Volume average
  const volumeAverage = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  // Support and Resistance (simple calculation from recent highs/lows)
  const recentData = priceData.slice(-30);
  const support = Math.min(...recentData.map((d) => d.low));
  const resistance = Math.max(...recentData.map((d) => d.high));

  return {
    rsi,
    macd,
    movingAverages: { ma20, ma50, ma200 },
    bollingerBands,
    volumeAverage,
    support,
    resistance,
  };
}

// Technical indicator calculations
function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateMACD(data: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12 - ema26;

  // Signal line is 9-period EMA of MACD
  const macdData = [];
  for (let i = 26; i < data.length; i++) {
    const slice = data.slice(0, i + 1);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdData.push(e12 - e26);
  }

  const signal = calculateEMA(macdData, 9);
  const histogram = macdLine - signal;

  return { value: macdLine, signal, histogram };
}

function calculateBollingerBands(
  data: number[],
  period: number,
  stdDev: number
): { upper: number; middle: number; lower: number } {
  const middle = calculateSMA(data, period);
  const slice = data.slice(-period);

  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: middle + standardDeviation * stdDev,
    middle,
    lower: middle - standardDeviation * stdDev,
  };
}

/**
 * Fetch crypto news from CoinGecko
 */
export async function fetchCryptoNews(symbol: string): Promise<NewsArticle[]> {
  try {
    // CoinGecko doesn't have a direct news endpoint, so we'll use their status updates
    const coinId = symbol.toLowerCase();
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/status_updates?per_page=20`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.status_updates?.map((update: any) => ({
      title: update.description || update.category || 'Update',
      url: update.project?.website || 'https://coingecko.com',
      source: update.user || 'CoinGecko',
      publishedAt: update.created_at,
    })) || [];
  } catch (error) {
    console.error('Crypto news fetch error:', error);
    return [];
  }
}

/**
 * Fetch stock news from Finnhub
 */
export async function fetchStockNews(symbol: string): Promise<NewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await fetch(
      `${FINNHUB_BASE}/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.slice(0, 20).map((article: any) => ({
      title: article.headline,
      url: article.url,
      source: article.source,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      summary: article.summary,
      image: article.image,
    }));
  } catch (error) {
    console.error('Stock news fetch error:', error);
    return [];
  }
}

/**
 * Fetch Fear & Greed Index for crypto
 */
export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const response = await fetch(`${FEAR_GREED_API}?limit=1`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const latest = data.data[0];

    return {
      value: parseInt(latest.value),
      classification: latest.value_classification,
      timestamp: parseInt(latest.timestamp),
    };
  } catch (error) {
    console.error('Fear & Greed fetch error:', error);
    return null;
  }
}

/**
 * Fetch analyst recommendations from Finnhub
 */
export async function fetchAnalystRatings(
  symbol: string
): Promise<{ buy: number; hold: number; sell: number; period: string } | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${FINNHUB_BASE}/stock/recommendation?symbol=${symbol.toUpperCase()}&token=${apiKey}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const latest = data[0];
    return {
      buy: latest.buy + latest.strongBuy,
      hold: latest.hold,
      sell: latest.sell + latest.strongSell,
      period: latest.period,
    };
  } catch (error) {
    console.error('Analyst ratings fetch error:', error);
    return null;
  }
}

/**
 * Fetch next earnings date from Finnhub
 */
export async function fetchEarningsCalendar(symbol: string): Promise<string | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${FINNHUB_BASE}/calendar/earnings?symbol=${symbol.toUpperCase()}&token=${apiKey}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.earningsCalendar || data.earningsCalendar.length === 0) return null;

    return data.earningsCalendar[0].date;
  } catch (error) {
    console.error('Earnings calendar fetch error:', error);
    return null;
  }
}
