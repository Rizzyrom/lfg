import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

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

        finnhubNews.slice(0, 10).forEach((item: any) => {
          articles.push({
            title: item.headline,
            description: item.summary || '',
            url: item.url,
            source: item.source,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
            imageUrl: item.image,
          })
        })
      }
    } catch (error) {
      console.error('Finnhub news fetch error:', error)
    }

    // Sort by publishedAt (most recent first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return NextResponse.json({
      success: true,
      articles: articles.slice(0, 20) // Return top 20
    })
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
