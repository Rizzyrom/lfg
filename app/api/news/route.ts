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

async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = []

    // Fetch crypto news from CoinDesk RSS
    try {
      const rssResponse = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/', {
        next: { revalidate: 300 } // Cache for 5 minutes
      })

      if (rssResponse.ok) {
        const rssText = await rssResponse.text()

        // Simple RSS parsing (title, link, pubDate)
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        // Skip first title (feed title) and combine
        for (let i = 1; i < Math.min(titles.length, 10); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'CoinDesk',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('CoinDesk RSS fetch error:', error)
    }

    // Fetch stock market news from Finnhub
    try {
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`,
        { next: { revalidate: 300 } }
      )

      if (finnhubResponse.ok) {
        const finnhubNews = await finnhubResponse.json()
        console.log(`Finnhub returned ${finnhubNews.length} articles`)

        if (Array.isArray(finnhubNews)) {
          finnhubNews.slice(0, 15).forEach((item: any) => {
            if (item.headline && item.url) {
              articles.push({
                title: item.headline,
                description: item.summary || '',
                url: item.url,
                source: item.source || 'Market News',
                publishedAt: new Date(item.datetime * 1000).toISOString(),
                imageUrl: item.image,
              })
            }
          })
        }
      } else {
        console.error('Finnhub API error:', finnhubResponse.status, await finnhubResponse.text())
      }
    } catch (error) {
      console.error('Finnhub news fetch error:', error)
    }

    // Add Yahoo Finance RSS as backup
    try {
      const yahooResponse = await fetch('https://finance.yahoo.com/news/rssindex', {
        next: { revalidate: 300 }
      })

      if (yahooResponse.ok) {
        const rssText = await yahooResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 10); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'Yahoo Finance',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('Yahoo Finance RSS fetch error:', error)
    }

    // Add Bloomberg RSS
    try {
      const bloombergResponse = await fetch('https://feeds.bloomberg.com/markets/news.rss', {
        next: { revalidate: 300 }
      })

      if (bloombergResponse.ok) {
        const rssText = await bloombergResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 8); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'Bloomberg',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('Bloomberg RSS fetch error:', error)
    }

    // Add Reuters Business RSS
    try {
      const reutersResponse = await fetch('https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', {
        next: { revalidate: 300 }
      })

      if (reutersResponse.ok) {
        const rssText = await reutersResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 8); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'Reuters',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('Reuters RSS fetch error:', error)
    }

    // Add CNBC Markets RSS
    try {
      const cnbcResponse = await fetch('https://www.cnbc.com/id/100003114/device/rss/rss.html', {
        next: { revalidate: 300 }
      })

      if (cnbcResponse.ok) {
        const rssText = await cnbcResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 8); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'CNBC',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('CNBC RSS fetch error:', error)
    }

    // Add MarketWatch RSS
    try {
      const marketWatchResponse = await fetch('https://www.marketwatch.com/rss/topstories', {
        next: { revalidate: 300 }
      })

      if (marketWatchResponse.ok) {
        const rssText = await marketWatchResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 10); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'MarketWatch',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('MarketWatch RSS fetch error:', error)
    }

    // Add Seeking Alpha RSS
    try {
      const seekingAlphaResponse = await fetch('https://seekingalpha.com/feed.xml', {
        next: { revalidate: 300 }
      })

      if (seekingAlphaResponse.ok) {
        const rssText = await seekingAlphaResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 10); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'Seeking Alpha',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('Seeking Alpha RSS fetch error:', error)
    }

    // Add Financial Times RSS
    try {
      const ftResponse = await fetch('https://www.ft.com/?format=rss', {
        next: { revalidate: 300 }
      })

      if (ftResponse.ok) {
        const rssText = await ftResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 8); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'Financial Times',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('Financial Times RSS fetch error:', error)
    }

    // Add Barron's RSS
    try {
      const barronsResponse = await fetch('https://www.barrons.com/rss/RSSMarketsMain.xml', {
        next: { revalidate: 300 }
      })

      if (barronsResponse.ok) {
        const rssText = await barronsResponse.text()
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g)
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g)
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g)

        const titles = Array.from(titleMatches).map(m => m[1])
        const links = Array.from(linkMatches).map(m => m[1])
        const descriptions = Array.from(descMatches).map(m => m[1])
        const pubDates = Array.from(pubDateMatches).map(m => m[1])

        for (let i = 1; i < Math.min(titles.length, 8); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: 'Barrons',
              publishedAt: pubDates[i] || new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error('Barrons RSS fetch error:', error)
    }

  // Sort by publishedAt (most recent first)
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  console.log(`Total articles collected: ${articles.length}`)

  return articles
}
