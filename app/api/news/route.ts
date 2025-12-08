import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { cachedRequest } from '@/lib/cache'
import { cachedResponse } from '@/lib/compression'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export async function GET() {
  try {
    await requireUser()

    // Cache news for 5 minutes (300 seconds)
    const articles = await cachedRequest<NewsArticle[]>(
      'news:feed',
      300,
      async () => {
        return fetchNewsArticles()
      }
    )

    // Return with cache headers
    return cachedResponse(
      {
        success: true,
        articles: articles.slice(0, 60),
        sources: ['CoinDesk', 'Finnhub', 'Yahoo Finance', 'Bloomberg', 'Reuters', 'CNBC', 'MarketWatch', 'Seeking Alpha', 'Financial Times', 'Barrons']
      },
      180, // 3 minutes max-age
      300  // 5 minutes stale-while-revalidate
    )
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// RSS feed configuration for parallel fetching
const RSS_FEEDS = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', limit: 10 },
  { url: 'https://finance.yahoo.com/news/rssindex', source: 'Yahoo Finance', limit: 10 },
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg', limit: 8 },
  { url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', source: 'Reuters', limit: 8 },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC', limit: 8 },
  { url: 'https://www.marketwatch.com/rss/topstories', source: 'MarketWatch', limit: 10 },
  { url: 'https://seekingalpha.com/feed.xml', source: 'Seeking Alpha', limit: 10 },
  { url: 'https://www.ft.com/?format=rss', source: 'Financial Times', limit: 8 },
  { url: 'https://www.barrons.com/rss/RSSMarketsMain.xml', source: 'Barrons', limit: 8 },
  // Additional crypto-focused feeds
  { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph', limit: 8 },
  { url: 'https://decrypt.co/feed', source: 'Decrypt', limit: 8 },
  { url: 'https://www.theblock.co/rss.xml', source: 'The Block', limit: 8 },
]

// Helper to parse RSS text - handles both CDATA and plain text
function parseRSSFeed(rssText: string, source: string, limit: number): NewsArticle[] {
  const articles: NewsArticle[] = []

  // Match both CDATA wrapped and plain text formats
  const titleMatches = rssText.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gs)
  const linkMatches = rssText.matchAll(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/gs)
  const descMatches = rssText.matchAll(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/gs)
  const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)
  const enclosureMatches = rssText.matchAll(/<enclosure[^>]*url="([^"]+)"[^>]*>/g)

  const titles = Array.from(titleMatches).map(m => m[1].trim())
  const links = Array.from(linkMatches).map(m => m[1].trim())
  const descriptions = Array.from(descMatches).map(m => m[1].trim().replace(/<[^>]+>/g, '').slice(0, 200))
  const pubDates = Array.from(pubDateMatches).map(m => m[1])
  const images = Array.from(enclosureMatches).map(m => m[1])

  // Skip first title (usually feed title)
  for (let i = 1; i < Math.min(titles.length, limit + 1); i++) {
    if (titles[i] && links[i]) {
      articles.push({
        title: titles[i],
        description: descriptions[i] || '',
        url: links[i],
        source,
        publishedAt: pubDates[i - 1] || new Date().toISOString(),
        imageUrl: images[i - 1],
      })
    }
  }

  return articles
}

// Parallel RSS fetcher
async function fetchRSSFeed(feed: typeof RSS_FEEDS[0]): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout per feed

    const response = await fetch(feed.url, {
      next: { revalidate: 300 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const rssText = await response.text()
      return parseRSSFeed(rssText, feed.source, feed.limit)
    }
  } catch (error) {
    console.error(`${feed.source} RSS fetch error:`, error instanceof Error ? error.message : error)
  }
  return []
}

// Fetch Finnhub news (API-based, not RSS)
async function fetchFinnhubNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) return []

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
      { next: { revalidate: 300 }, signal: controller.signal }
    )

    clearTimeout(timeoutId)

    if (response.ok) {
      const news = await response.json()
      if (Array.isArray(news)) {
        return news.slice(0, 15).map((item: any) => ({
          title: item.headline,
          description: item.summary || '',
          url: item.url,
          source: item.source || 'Market News',
          publishedAt: new Date(item.datetime * 1000).toISOString(),
          imageUrl: item.image,
        })).filter((a: NewsArticle) => a.title && a.url)
      }
    }
  } catch (error) {
    console.error('Finnhub news fetch error:', error instanceof Error ? error.message : error)
  }
  return []
}

async function fetchNewsArticles(): Promise<NewsArticle[]> {
  console.log('[News] Starting parallel fetch from all sources...')
  const startTime = Date.now()

  // Fetch ALL sources in parallel for maximum speed
  const [finnhubArticles, ...rssResults] = await Promise.all([
    fetchFinnhubNews(),
    ...RSS_FEEDS.map(feed => fetchRSSFeed(feed))
  ])

  // Combine all articles
  const articles = [
    ...finnhubArticles,
    ...rssResults.flat()
  ]

  // Deduplicate by URL
  const seen = new Set<string>()
  const uniqueArticles = articles.filter(article => {
    if (seen.has(article.url)) return false
    seen.add(article.url)
    return true
  })

  // Sort by publishedAt (most recent first)
  uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  console.log(`[News] Fetched ${uniqueArticles.length} unique articles in ${Date.now() - startTime}ms`)

  return uniqueArticles
}
