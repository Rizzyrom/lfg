'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { TrendingUp, TrendingDown, ExternalLink, ThumbsUp, MessageCircle, Share2, Newspaper } from 'lucide-react'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

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
}

interface Tweet {
  id: string
  text: string
  author: string
  createdAt: string
  likes: number
  retweets: number
  url: string
}

interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

type FeedItem = {
  type: 'news' | 'reddit' | 'twitter' | 'gainer' | 'loser'
  timestamp: number
  data: NewsArticle | RedditPost | Tweet | MarketMover
}

export default function UnifiedFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'social' | 'news' | 'market'>('all')
  const [displayCount, setDisplayCount] = useState(15) // Initial load: 15 items

  const fetchAllFeeds = useCallback(async () => {
    try {
      // Fetch feeds in parallel with optimized limits
      const [newsRes, redditRes, twitterRes] = await Promise.all([
        fetch('/api/news', { next: { revalidate: 180 } }),
        fetch('/api/social/reddit', { next: { revalidate: 120 } }),
        fetch('/api/social/twitter', { next: { revalidate: 120 } }),
      ])

      const [newsData, redditData, twitterData] = await Promise.all([
        newsRes.json(),
        redditRes.json(),
        twitterRes.json(),
      ])

      const items: FeedItem[] = []

      // Add news articles (limit to 15 for performance)
      if (newsData.articles) {
        newsData.articles.slice(0, 15).forEach((article: NewsArticle) => {
          items.push({
            type: 'news',
            timestamp: new Date(article.publishedAt).getTime(),
            data: article,
          })
        })
      }

      // Add Reddit posts (limit to 20)
      if (redditData.posts) {
        console.log('Reddit posts received:', redditData.posts.length)
        redditData.posts.slice(0, 20).forEach((post: RedditPost) => {
          console.log('Adding Reddit post:', post.title.substring(0, 50))
          items.push({
            type: 'reddit',
            timestamp: post.created * 1000,
            data: post,
          })
        })
      } else {
        console.log('No Reddit posts in response:', redditData)
      }

      // Add tweets (limit to 10)
      if (twitterData.tweets) {
        twitterData.tweets.slice(0, 10).forEach((tweet: Tweet) => {
          items.push({
            type: 'twitter',
            timestamp: new Date(tweet.createdAt).getTime(),
            data: tweet,
          })
        })
      }

      // Sort by timestamp (most recent first)
      items.sort((a, b) => b.timestamp - a.timestamp)

      setFeedItems(items)
    } catch (error) {
      console.error('Failed to fetch feeds:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllFeeds()
    // Increased interval to 3 minutes for better performance
    const interval = setInterval(fetchAllFeeds, 180000)
    return () => clearInterval(interval)
  }, [fetchAllFeeds])

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Memoize filtered items for performance
  const filteredItems = useMemo(() => {
    return feedItems.filter((item) => {
      if (filter === 'all') return true
      if (filter === 'social') return item.type === 'reddit' || item.type === 'twitter'
      if (filter === 'news') return item.type === 'news'
      if (filter === 'market') return item.type === 'gainer' || item.type === 'loser'
      return true
    })
  }, [feedItems, filter])

  // Display items with lazy loading
  const displayedItems = useMemo(() =>
    filteredItems.slice(0, displayCount),
    [filteredItems, displayCount]
  )

  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 10, filteredItems.length))
  }, [filteredItems.length])

  const renderFeedItem = (item: FeedItem) => {
    switch (item.type) {
      case 'news':
        const news = item.data as NewsArticle
        return (
          <div key={`news-${news.url}`} className="card p-4 hover:border-tv-blue transition group">
            <div className="flex items-start gap-3 mb-2">
              <div className="p-2 bg-tv-blue/10 rounded-lg">
                <Newspaper className="w-4 h-4 text-tv-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-1 rounded bg-tv-blue/20 text-tv-blue font-bold">NEWS</span>
                  <span className="text-xs text-tv-text-soft">{news.source}</span>
                  <span className="text-xs text-tv-text-soft">• {getTimeAgo(item.timestamp)}</span>
                </div>
                <a href={news.url} target="_blank" rel="noopener noreferrer" className="block">
                  <h3 className="text-base font-bold text-tv-text mb-1 group-hover:text-tv-blue transition line-clamp-2">
                    {news.title}
                  </h3>
                </a>
                {news.description && (
                  <p className="text-sm text-tv-text-soft line-clamp-2">{news.description}</p>
                )}
              </div>
              {news.imageUrl && (
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-tv-chip">
                  <img src={news.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        )

      case 'reddit':
        const reddit = item.data as RedditPost
        return (
          <div key={`reddit-${reddit.id}`} className="card p-4 hover:border-[#FF4500] transition group">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FF4500]/10 rounded-lg">
                <svg className="w-4 h-4 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-1 rounded bg-[#FF4500]/20 text-[#FF4500] font-bold">r/{reddit.subreddit}</span>
                  <span className="text-xs text-tv-text-soft">u/{reddit.author}</span>
                  <span className="text-xs text-tv-text-soft">• {getTimeAgo(item.timestamp)}</span>
                </div>
                <a href={reddit.permalink} target="_blank" rel="noopener noreferrer" className="block">
                  <h3 className="text-base font-bold text-tv-text mb-2 group-hover:text-[#FF4500] transition line-clamp-2">
                    {reddit.title}
                  </h3>
                </a>
                <div className="flex items-center gap-3 text-xs text-tv-text-soft">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{formatNumber(reddit.score)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{formatNumber(reddit.numComments)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'twitter':
        const tweet = item.data as Tweet
        return (
          <div key={`twitter-${tweet.id}`} className="card p-4 hover:border-[#1DA1F2] transition group">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#1DA1F2]/10 rounded-lg">
                <svg className="w-4 h-4 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-1 rounded bg-[#1DA1F2]/20 text-[#1DA1F2] font-bold">@{tweet.author}</span>
                  <span className="text-xs text-tv-text-soft">• {getTimeAgo(item.timestamp)}</span>
                </div>
                <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="block">
                  <p className="text-sm text-tv-text mb-2 group-hover:text-[#1DA1F2] transition line-clamp-3">
                    {tweet.text}
                  </p>
                </a>
                <div className="flex items-center gap-3 text-xs text-tv-text-soft">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{formatNumber(tweet.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    <span>{formatNumber(tweet.retweets)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tv-text">Live Feed</h1>
          <p className="text-sm text-tv-text-soft mt-1">
            Real-time market news, social buzz, and community insights
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === 'all'
                ? 'bg-tv-blue text-white shadow-glow-blue'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('social')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === 'social'
                ? 'bg-tv-blue text-white shadow-glow-blue'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
            }`}
          >
            Social
          </button>
          <button
            onClick={() => setFilter('news')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === 'news'
                ? 'bg-tv-blue text-white shadow-glow-blue'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
            }`}
          >
            News
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-tv-chip rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-tv-chip rounded w-3/4"></div>
                    <div className="h-3 bg-tv-chip rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredItems.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-tv-text-soft">No feed items available at the moment.</p>
          </div>
        ) : (
          <>
            {displayedItems.map((item) => renderFeedItem(item))}
            {displayCount < filteredItems.length && (
              <button
                onClick={loadMore}
                className="w-full py-3 px-4 bg-tv-chip hover:bg-tv-hover rounded-lg text-tv-text font-bold transition-all"
              >
                Load More ({filteredItems.length - displayCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
