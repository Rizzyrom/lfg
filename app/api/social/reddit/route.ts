import { NextResponse } from 'next/server'

// Top stock and crypto subreddits as requested
const SUBREDDITS = [
  'wallstreetbets',
  'investing',
  'StockMarket',
  'options',
  'algotrading',
  'superstonk',
  'CryptoCurrency',
  'CryptoMarkets',
]

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

// Cache for Reddit OAuth token
let cachedToken: { access_token: string; expires_at: number } | null = null

// Get Reddit OAuth token
async function getRedditToken(): Promise<string | null> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('Reddit API credentials not configured')
    return null
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LFG:v1.0.0 (by /u/LFGmarketpulse)',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      console.error('Reddit OAuth failed:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000) - 60000, // Refresh 1 min before expiry
    }

    console.log('Reddit OAuth token obtained')
    return cachedToken.access_token
  } catch (error) {
    console.error('Reddit OAuth error:', error)
    return null
  }
}

export async function GET() {
  try {
    const token = await getRedditToken()
    const allPosts: RedditPost[] = []

    // Fetch from all requested subreddits
    const fetchPromises = SUBREDDITS.map(async (subreddit) => {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot?limit=10`
        const headers: HeadersInit = {
          'User-Agent': 'LFG:v1.0.0 (by /u/LFGmarketpulse)',
          'Accept': 'application/json',
        }

        // Use OAuth if available, otherwise fallback to public API
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(url, {
          headers,
          next: { revalidate: 120 }, // Cache for 2 minutes
        })

        if (!response.ok) {
          console.warn(`Failed to fetch r/${subreddit}: ${response.status}`)
          return []
        }

        const data = await response.json()

        return data.data.children
          .filter((child: any) => !child.data.stickied) // Filter out stickied posts
          .map((child: any) => ({
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

    // Sort by score and recency (weighted combination)
    const topPosts = allPosts
      .sort((a, b) => {
        const aScore = a.score + (a.created * 0.01) // Weight recent posts slightly
        const bScore = b.score + (b.created * 0.01)
        return bScore - aScore
      })
      .slice(0, 40)

    console.log(`Fetched ${topPosts.length} Reddit posts from ${SUBREDDITS.length} subreddits`)

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
