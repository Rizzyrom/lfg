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
      // Fetch feeds in parallel with cache headers
      const [newsRes, redditRes, twitterRes] = await Promise.all([
        fetch('/api/news', {
          headers: { 'Cache-Control': 'max-age=180' }
        }),
        fetch('/api/social/reddit', {
          headers: { 'Cache-Control': 'max-age=120' }
        }),
        fetch('/api/social/twitter', {
          headers: { 'Cache-Control': 'max-age=120' }
        }),
      ])

      // Early exit if no successful responses
      if (!newsRes.ok && !redditRes.ok && !twitterRes.ok) {
        throw new Error('All feed sources failed')
      }

      const [newsData, redditData, twitterData] = await Promise.all([
        newsRes.ok ? newsRes.json() : Promise.resolve({ articles: [] }),
        redditRes.ok ? redditRes.json() : Promise.resolve({ posts: [] }),
        twitterRes.ok ? twitterRes.json() : Promise.resolve({ tweets: [] }),
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

  const renderFeedItem = useCallback((item: FeedItem) => {
    switch (item.type) {
      case 'news':
        const news = item.data as NewsArticle
        return (
          <div key={`news-${news.url}`} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border-2 border-tv-grid/30 hover:border-tv-blue/50 transition-all duration-300 group shadow-sm hover:shadow-lg active:scale-[0.99]">
            <div className="flex items-start gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-tv-blue/15 to-tv-blue/5 rounded-xl flex-shrink-0 shadow-sm">
                <Newspaper className="w-5 h-5 text-tv-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-tv-blue to-tv-blue-hover text-white font-bold shadow-sm">NEWS</span>
                  <span className="text-xs text-tv-text-soft font-semibold">{news.source}</span>
                  <span className="text-xs text-tv-text-muted">• {getTimeAgo(item.timestamp)}</span>
                </div>
                <a href={news.url} target="_blank" rel="noopener noreferrer" className="block">
                  <h3 className="text-base font-bold text-tv-text mb-2 group-hover:text-tv-blue transition-colors duration-200 line-clamp-2 leading-snug">
                    {news.title}
                  </h3>
                </a>
                {news.description && (
                  <p className="text-sm text-tv-text-soft line-clamp-2 leading-relaxed">{news.description}</p>
                )}
              </div>
              {news.imageUrl && (
                <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-tv-chip shadow-md">
                  <img src={news.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
            </div>
          </div>
        )

      case 'reddit':
        const reddit = item.data as RedditPost
        return (
          <div key={`reddit-${reddit.id}`} className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl p-4 border-2 border-tv-grid/30 hover:border-[#FF4500]/50 transition-all duration-300 group shadow-sm hover:shadow-lg active:scale-[0.99]">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#FF4500]/15 to-[#FF4500]/5 rounded-xl flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF5722] text-white font-bold shadow-sm">r/{reddit.subreddit}</span>
                  <span className="text-xs text-tv-text-soft font-semibold">u/{reddit.author}</span>
                  <span className="text-xs text-tv-text-muted">• {getTimeAgo(item.timestamp)}</span>
                </div>
                <a href={`https://reddit.com${reddit.permalink}`} target="_blank" rel="noopener noreferrer" className="block">
                  <h3 className="text-base font-bold text-tv-text mb-3 group-hover:text-[#FF4500] transition-colors duration-200 line-clamp-2 leading-snug">
                    {reddit.title}
                  </h3>
                </a>
                <div className="flex items-center gap-4 text-xs text-tv-text-soft">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tv-bg/50 rounded-lg">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="font-semibold">{formatNumber(reddit.score)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tv-bg/50 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="font-semibold">{formatNumber(reddit.numComments)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'twitter':
        const tweet = item.data as Tweet
        return (
          <div key={`twitter-${tweet.id}`} className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 border-2 border-tv-grid/30 hover:border-[#1DA1F2]/50 transition-all duration-300 group shadow-sm hover:shadow-lg active:scale-[0.99]">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#1DA1F2]/15 to-[#1DA1F2]/5 rounded-xl flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-[#1DA1F2] to-[#0D8BD9] text-white font-bold shadow-sm">@{tweet.author}</span>
                  <span className="text-xs text-tv-text-muted">• {getTimeAgo(item.timestamp)}</span>
                </div>
                <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="block">
                  <p className="text-sm text-tv-text mb-3 group-hover:text-[#1DA1F2] transition-colors duration-200 line-clamp-3 leading-relaxed">
                    {tweet.text}
                  </p>
                </a>
                <div className="flex items-center gap-4 text-xs text-tv-text-soft">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tv-bg/50 rounded-lg">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="font-semibold">{formatNumber(tweet.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tv-bg/50 rounded-lg">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">{formatNumber(tweet.retweets)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }, [getTimeAgo, formatNumber])

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tv-text bg-gradient-to-r from-tv-text to-tv-text-soft bg-clip-text">Live Feed</h1>
          <p className="text-sm text-tv-text-soft mt-1.5 font-medium">
            Real-time market news, social buzz, and community insights
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
              filter === 'all'
                ? 'bg-gradient-to-r from-tv-blue to-tv-blue-hover text-white shadow-lg shadow-tv-blue/30'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text hover:bg-tv-hover/50 active:scale-95'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('social')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
              filter === 'social'
                ? 'bg-gradient-to-r from-tv-blue to-tv-blue-hover text-white shadow-lg shadow-tv-blue/30'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text hover:bg-tv-hover/50 active:scale-95'
            }`}
          >
            Social
          </button>
          <button
            onClick={() => setFilter('news')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
              filter === 'news'
                ? 'bg-gradient-to-r from-tv-blue to-tv-blue-hover text-white shadow-lg shadow-tv-blue/30'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text hover:bg-tv-hover/50 active:scale-95'
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
              <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border-2 border-tv-grid/20 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-tv-chip to-tv-grid rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gradient-to-r from-tv-chip to-tv-grid rounded-lg w-3/4"></div>
                    <div className="h-3 bg-gradient-to-r from-tv-chip to-tv-grid rounded-lg w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredItems.length === 0 ? (
          <div className="bg-gradient-to-br from-tv-panel to-tv-bg rounded-2xl p-10 text-center shadow-sm border border-tv-grid/30">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-tv-blue/20 to-tv-blue/5 flex items-center justify-center">
              <Newspaper className="w-10 h-10 text-tv-blue" />
            </div>
            <p className="text-tv-text font-semibold text-lg mb-2">No feed items available</p>
            <p className="text-tv-text-soft text-sm">Check back later for updates</p>
          </div>
        ) : (
          <>
            {displayedItems.map((item) => renderFeedItem(item))}
            {displayCount < filteredItems.length && (
              <button
                onClick={loadMore}
                className="w-full py-4 px-4 bg-gradient-to-r from-tv-chip to-tv-chip/80 hover:from-tv-hover hover:to-tv-hover/80 rounded-2xl text-tv-text font-bold transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.99] border-2 border-tv-grid/30"
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
