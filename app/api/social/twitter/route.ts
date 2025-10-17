import { NextResponse } from 'next/server'
import { batchValidateTweets } from '@/lib/twitter-validator'

// Note: This is a simplified version. For full Twitter API access, you'll need:
// 1. Twitter API v2 Bearer Token (X_BEARER_TOKEN or TWITTER_BEARER_TOKEN)
// 2. Set in environment variables
// 3. Twitter Developer Account

const TWITTER_BEARER_TOKEN = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN

// Top X accounts for stocks/investing
const STOCK_ACCOUNTS = [
  'awealthofcs',
  '10kdiver',
  'CNBC',
  'Benzinga',
  'BreakoutStocks',
  'bespokeinvest',
  'WSJMarkets',
  'Stocktwits',
  'ReformedBroker', // Josh Brown
  'MebFaber'
]

// Top X accounts for crypto/web3
const CRYPTO_ACCOUNTS = [
  'VitalikButerin',
  'cz_binance',
  'CryptoMichNL',
  'ali_charts',
  'glassnode',
  'WuBlockchain',
  'intocryptoverse',
  'rektcapital',
  'CryptoRover',
  'ilCapoOfCrypto'
]

// Build queries from top accounts
const TRENDING_QUERIES = [
  ...STOCK_ACCOUNTS.map(account => `from:${account}`),
  ...CRYPTO_ACCOUNTS.map(account => `from:${account}`),
  '#Bitcoin',
  '#Ethereum',
  '#Stocks',
  '#WallStreetBets',
  '$BTC',
  '$ETH'
]

interface Tweet {
  id: string
  text: string
  author: string
  createdAt: string
  likes: number
  retweets: number
  url: string
}

export async function GET() {
  try {
    // If no Twitter API token, return mock data
    if (!TWITTER_BEARER_TOKEN) {
      const mockTweets: Tweet[] = [
        {
          id: '1',
          text: '🚀 Bitcoin breaking through $45k! The bull run is just getting started. #BTC #Crypto',
          author: 'CryptoWhale',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likes: 1234,
          retweets: 456,
          url: 'https://twitter.com/example/status/1',
        },
        {
          id: '2',
          text: 'BREAKING: Major institutional investor announces $1B crypto fund. This is huge for adoption! 📈',
          author: 'MarketNews',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          likes: 2341,
          retweets: 789,
          url: 'https://twitter.com/example/status/2',
        },
        {
          id: '3',
          text: 'Technical analysis: SPY showing strong support at 450. Watching for breakout above 460. #Stocks #Trading',
          author: 'ChartMaster',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          likes: 567,
          retweets: 123,
          url: 'https://twitter.com/example/status/3',
        },
      ]

      return NextResponse.json({
        success: true,
        tweets: mockTweets,
        timestamp: new Date().toISOString(),
        note: 'Using mock data. Set TWITTER_BEARER_TOKEN for live tweets.',
      })
    }

    // Real Twitter API implementation
    const tweets: Tweet[] = []

    for (const query of TRENDING_QUERIES.slice(0, 5)) {
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username`,
        {
          headers: {
            Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
          },
        }
      )

      if (!response.ok) continue

      const data = await response.json()

      if (data.data) {
        const users = data.includes?.users || []
        const parsedTweets = data.data.map((tweet: any) => {
          const author = users.find((u: any) => u.id === tweet.author_id)
          return {
            id: tweet.id,
            text: tweet.text,
            author: author?.username || 'Unknown',
            createdAt: tweet.created_at,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
          }
        })

        tweets.push(...parsedTweets)
      }
    }

    // Sort by engagement (likes + retweets)
    const topTweets = tweets
      .sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets))
      .slice(0, 20)

    // Validate and snapshot tweets in background (don't await)
    const tweetIds = topTweets.map(t => t.id)
    batchValidateTweets(tweetIds)
      .then(() => console.log(`Validated ${tweetIds.length} tweets`))
      .catch(err => console.error('Failed to validate tweets:', err))

    return NextResponse.json({
      success: true,
      tweets: topTweets,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Twitter fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweets' },
      { status: 500 }
    )
  }
}
