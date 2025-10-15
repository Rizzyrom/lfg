import { NextResponse } from 'next/server'

// Top stock subreddits
const STOCK_SUBREDDITS = [
  'wallstreetbets',
  'stocks',
  'investing',
  'StockMarket',
  'pennystocks',
  'AlgoTrading',
  'ValueInvesting',
  'DueDiligence',
  'UndervaluedStonks',
  'trading'
]

// Top crypto subreddits
const CRYPTO_SUBREDDITS = [
  'CryptoCurrency',
  'CryptoMarkets',
  'Altcoin',
  'CryptoTechnology',
  'CryptoMoonShots',
  'NFT',
  'SatoshiStreetBets',
  'defi',
  'Crypto_General',
  'crypto'
]

const SUBREDDITS = [...STOCK_SUBREDDITS, ...CRYPTO_SUBREDDITS]

interface RedditPost {
  id: string
  title: string
  author: string
  subreddit: string
  score: number
  numComments: number
  url: string
  permalink: string
  created: number
  thumbnail?: string
  postHint?: string
}

export async function GET() {
  try {
    const allPosts: RedditPost[] = []

    // Fetch hot posts from multiple subreddits concurrently
    const fetchPromises = SUBREDDITS.slice(0, 10).map(async (subreddit) => {
      try {
        const response = await fetch(
          `https://old.reddit.com/r/${subreddit}/hot/.json?limit=5`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 180 }, // Cache for 3 minutes
          }
        )

        if (!response.ok) {
          console.warn(`Failed to fetch r/${subreddit}:`, response.status)
          return []
        }

        const data = await response.json()
        return data.data.children.map((child: any) => ({
          id: child.data.id,
          title: child.data.title,
          author: child.data.author,
          subreddit: child.data.subreddit,
          score: child.data.score,
          numComments: child.data.num_comments,
          url: child.data.url,
          permalink: `https://reddit.com${child.data.permalink}`,
          created: child.data.created_utc,
          thumbnail: child.data.thumbnail !== 'self' && child.data.thumbnail !== 'default'
            ? child.data.thumbnail
            : undefined,
          postHint: child.data.post_hint,
        }))
      } catch (err) {
        console.warn(`Error fetching r/${subreddit}:`, err)
        return []
      }
    })

    const results = await Promise.all(fetchPromises)
    results.forEach(posts => allPosts.push(...posts))

    // Sort by created time (most recent first) and take top 30
    const topPosts = allPosts
      .sort((a, b) => b.created - a.created)
      .slice(0, 30)

    console.log(`Fetched ${topPosts.length} Reddit posts from ${SUBREDDITS.slice(0, 10).length} subreddits`)

    return NextResponse.json({
      success: true,
      posts: topPosts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Reddit fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Reddit posts' },
      { status: 500 }
    )
  }
}
