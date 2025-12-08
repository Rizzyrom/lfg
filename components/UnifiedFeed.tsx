'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { TrendingUp, TrendingDown, ExternalLink, Heart, MessageCircle, Repeat2, Newspaper, Loader2, RefreshCw, Filter } from 'lucide-react'

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
  const [displayCount, setDisplayCount] = useState(15)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAllFeeds = useCallback(async () => {
    try {
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

      if (!newsRes.ok && !redditRes.ok && !twitterRes.ok) {
        throw new Error('All feed sources failed')
      }

      const [newsData, redditData, twitterData] = await Promise.all([
        newsRes.ok ? newsRes.json() : Promise.resolve({ articles: [] }),
        redditRes.ok ? redditRes.json() : Promise.resolve({ posts: [] }),
        twitterRes.ok ? twitterRes.json() : Promise.resolve({ tweets: [] }),
      ])

      const items: FeedItem[] = []

      if (newsData.articles) {
        newsData.articles.slice(0, 15).forEach((article: NewsArticle) => {
          items.push({
            type: 'news',
            timestamp: new Date(article.publishedAt).getTime(),
            data: article,
          })
        })
      }

      if (redditData.posts) {
        redditData.posts.slice(0, 20).forEach((post: RedditPost) => {
          items.push({
            type: 'reddit',
            timestamp: post.created * 1000,
            data: post,
          })
        })
      }

      if (twitterData.tweets) {
        twitterData.tweets.slice(0, 10).forEach((tweet: Tweet) => {
          items.push({
            type: 'twitter',
            timestamp: new Date(tweet.createdAt).getTime(),
            data: tweet,
          })
        })
      }

      items.sort((a, b) => b.timestamp - a.timestamp)
      setFeedItems(items)
    } catch (error) {
      console.error('Failed to fetch feeds:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAllFeeds()
    const interval = setInterval(fetchAllFeeds, 180000)
    return () => clearInterval(interval)
  }, [fetchAllFeeds])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAllFeeds()
  }

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const filteredItems = useMemo(() => {
    return feedItems.filter((item) => {
      if (filter === 'all') return true
      if (filter === 'social') return item.type === 'reddit' || item.type === 'twitter'
      if (filter === 'news') return item.type === 'news'
      if (filter === 'market') return item.type === 'gainer' || item.type === 'loser'
      return true
    })
  }, [feedItems, filter])

  const displayedItems = useMemo(() =>
    filteredItems.slice(0, displayCount),
    [filteredItems, displayCount]
  )

  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 10, filteredItems.length))
  }, [filteredItems.length])

  const renderFeedItem = useCallback((item: FeedItem, index: number) => {
    switch (item.type) {
      case 'news':
        const news = item.data as NewsArticle
        return (
          <a
            key={`news-${news.url}-${index}`}
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl border border-tv-border hover:border-tv-blue/30 hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Source & Time */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tv-blue-soft">
                      <Newspaper className="w-3 h-3 text-tv-blue" />
                      <span className="text-[10px] font-bold text-tv-blue uppercase tracking-wide">News</span>
                    </div>
                    <span className="text-xs font-semibold text-tv-text-soft">{news.source}</span>
                    <span className="text-xs text-tv-text-muted">• {getTimeAgo(item.timestamp)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-tv-text mb-2 group-hover:text-tv-blue transition-colors line-clamp-2 leading-snug">
                    {news.title}
                  </h3>

                  {/* Description */}
                  {news.description && (
                    <p className="text-sm text-tv-text-soft line-clamp-2 leading-relaxed">{news.description}</p>
                  )}
                </div>

                {/* Image */}
                {news.imageUrl && (
                  <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-tv-bg-secondary">
                    <img
                      src={news.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>
          </a>
        )

      case 'reddit':
        const reddit = item.data as RedditPost
        return (
          <a
            key={`reddit-${reddit.id}`}
            href={reddit.permalink.startsWith('http') ? reddit.permalink : `https://reddit.com${reddit.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl border border-tv-border hover:border-[#FF4500]/30 hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Reddit Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4500]/10 to-[#FF4500]/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Subreddit & Author */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-[#FF4500]/10 text-[#FF4500] font-bold">
                      r/{reddit.subreddit}
                    </span>
                    <span className="text-xs text-tv-text-soft font-medium">u/{reddit.author}</span>
                    <span className="text-xs text-tv-text-muted">• {getTimeAgo(item.timestamp)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-tv-text mb-3 group-hover:text-[#FF4500] transition-colors line-clamp-2 leading-snug">
                    {reddit.title}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tv-bg-secondary">
                      <Heart className="w-3.5 h-3.5 text-tv-text-muted" />
                      <span className="text-xs font-semibold text-tv-text-soft">{formatNumber(reddit.score)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tv-bg-secondary">
                      <MessageCircle className="w-3.5 h-3.5 text-tv-text-muted" />
                      <span className="text-xs font-semibold text-tv-text-soft">{formatNumber(reddit.numComments)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        )

      case 'twitter':
        const tweet = item.data as Tweet
        return (
          <a
            key={`twitter-${tweet.id}`}
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl border border-tv-border hover:border-[#1DA1F2]/30 hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* X/Twitter Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tv-text/10 to-tv-text/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-tv-text" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author & Time */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-tv-text/10 text-tv-text font-bold">
                      @{tweet.author}
                    </span>
                    <span className="text-xs text-tv-text-muted">• {getTimeAgo(item.timestamp)}</span>
                  </div>

                  {/* Tweet Text */}
                  <p className="text-sm text-tv-text mb-3 group-hover:text-tv-text-soft transition-colors line-clamp-3 leading-relaxed">
                    {tweet.text}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tv-bg-secondary">
                      <Heart className="w-3.5 h-3.5 text-tv-text-muted" />
                      <span className="text-xs font-semibold text-tv-text-soft">{formatNumber(tweet.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tv-bg-secondary">
                      <Repeat2 className="w-3.5 h-3.5 text-tv-text-muted" />
                      <span className="text-xs font-semibold text-tv-text-soft">{formatNumber(tweet.retweets)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        )

      default:
        return null
    }
  }, [])

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'news', label: 'News' },
    { key: 'social', label: 'Social' },
  ]

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tv-bg-secondary flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-tv-text" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-tv-text">Feed</h1>
              <p className="text-tv-text-soft text-sm">Real-time market news & social buzz</p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-tv-bg-secondary hover:bg-tv-chip transition-all active:scale-95 touch-manipulation"
          >
            <RefreshCw className={`w-5 h-5 text-tv-text-soft ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${
                filter === tab.key
                  ? 'bg-tv-text text-white shadow-sm'
                  : 'bg-tv-bg-secondary text-tv-text-soft hover:text-tv-text hover:bg-tv-chip'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Items */}
      <div className="space-y-3">
        {loading ? (
          // Premium Loading Skeleton
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-tv-border animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-tv-bg-secondary rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-16 bg-tv-bg-secondary rounded-lg" />
                      <div className="h-4 w-24 bg-tv-bg-secondary rounded-lg" />
                    </div>
                    <div className="h-5 bg-tv-bg-secondary rounded-lg w-full" />
                    <div className="h-5 bg-tv-bg-secondary rounded-lg w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-tv-bg-secondary rounded-lg" />
                      <div className="h-8 w-16 bg-tv-bg-secondary rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredItems.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl p-12 text-center border border-tv-border animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-tv-bg-secondary flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-tv-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-tv-text mb-2">No items found</h3>
            <p className="text-tv-text-soft text-sm max-w-xs mx-auto">
              Check back later for the latest news and social updates
            </p>
          </div>
        ) : (
          <>
            {displayedItems.map((item, index) => renderFeedItem(item, index))}

            {/* Load More */}
            {displayCount < filteredItems.length && (
              <button
                onClick={loadMore}
                className="w-full py-4 bg-white rounded-2xl border border-tv-border hover:border-tv-blue/30 hover:shadow-lg text-tv-text font-semibold transition-all active:scale-[0.99] group"
              >
                <span className="group-hover:text-tv-blue transition-colors">
                  Load More
                </span>
                <span className="text-tv-text-muted ml-2">
                  ({filteredItems.length - displayCount} remaining)
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
