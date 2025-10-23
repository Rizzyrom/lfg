'use client'

import { memo } from 'react'
import { Newspaper, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'

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

type FeedItemData = NewsArticle | RedditPost | Tweet

interface FeedItemProps {
  type: 'news' | 'reddit' | 'twitter'
  data: FeedItemData
  timestamp: number
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const getTimeAgo = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function NewsItem({ data, timestamp }: { data: NewsArticle; timestamp: number }) {
  return (
    <div className="card p-4 hover:border-tv-blue transition group">
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 bg-tv-blue/10 rounded-lg">
          <Newspaper className="w-4 h-4 text-tv-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-1 rounded bg-tv-blue/20 text-tv-blue font-bold">NEWS</span>
            <span className="text-xs text-tv-text-soft">{data.source}</span>
            <span className="text-xs text-tv-text-soft">• {getTimeAgo(timestamp)}</span>
          </div>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="text-base font-bold text-tv-text mb-1 group-hover:text-tv-blue transition line-clamp-2">
              {data.title}
            </h3>
          </a>
          {data.description && (
            <p className="text-sm text-tv-text-soft line-clamp-2">{data.description}</p>
          )}
        </div>
        {data.imageUrl && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-tv-chip">
            <img src={data.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </div>
    </div>
  )
}

function RedditItem({ data, timestamp }: { data: RedditPost; timestamp: number }) {
  return (
    <div className="card p-4 hover:border-[#FF4500] transition group">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[#FF4500]/10 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4500]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-1 rounded bg-[#FF4500]/20 text-[#FF4500] font-bold">r/{data.subreddit}</span>
            <span className="text-xs text-tv-text-soft">u/{data.author}</span>
            <span className="text-xs text-tv-text-soft">• {getTimeAgo(timestamp)}</span>
          </div>
          <a href={`https://reddit.com${data.permalink}`} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="text-base font-bold text-tv-text mb-2 group-hover:text-[#FF4500] transition line-clamp-2">
              {data.title}
            </h3>
          </a>
          <div className="flex items-center gap-3 text-xs text-tv-text-soft">
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{formatNumber(data.score)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{formatNumber(data.numComments)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TwitterItem({ data, timestamp }: { data: Tweet; timestamp: number }) {
  return (
    <div className="card p-4 hover:border-[#1DA1F2] transition group">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[#1DA1F2]/10 rounded-lg">
          <svg className="w-4 h-4 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-1 rounded bg-[#1DA1F2]/20 text-[#1DA1F2] font-bold">@{data.author}</span>
            <span className="text-xs text-tv-text-soft">• {getTimeAgo(timestamp)}</span>
          </div>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="block">
            <p className="text-sm text-tv-text mb-2 group-hover:text-[#1DA1F2] transition line-clamp-3">
              {data.text}
            </p>
          </a>
          <div className="flex items-center gap-3 text-xs text-tv-text-soft">
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{formatNumber(data.likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              <span>{formatNumber(data.retweets)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedItem({ type, data, timestamp }: FeedItemProps) {
  switch (type) {
    case 'news':
      return <NewsItem data={data as NewsArticle} timestamp={timestamp} />
    case 'reddit':
      return <RedditItem data={data as RedditPost} timestamp={timestamp} />
    case 'twitter':
      return <TwitterItem data={data as Tweet} timestamp={timestamp} />
    default:
      return null
  }
}

// Memoized to prevent unnecessary re-renders
export default memo(FeedItem, (prev, next) => {
  return (
    prev.type === next.type &&
    prev.timestamp === next.timestamp &&
    JSON.stringify(prev.data) === JSON.stringify(next.data)
  )
})
