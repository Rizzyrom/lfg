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

    // Fetch hot posts from each subreddit
    for (const subreddit of SUBREDDITS) {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
        {
          headers: {
            'User-Agent': 'LFG-MarketCommunity/1.0',
          },
        }
      )

      if (!response.ok) continue

      const data = await response.json()
      const posts = data.data.children.map((child: any) => ({
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

      allPosts.push(...posts)
    }

    // Sort by score (upvotes) and take top 20
    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

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
