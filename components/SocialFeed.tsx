'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'

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

export default function SocialFeed() {
  const [activeTab, setActiveTab] = useState<'reddit' | 'twitter'>('reddit')
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReddit()
    fetchTwitter()
  }, [])

  const fetchReddit = async () => {
    try {
      const res = await fetch('/api/social/reddit')
      const data = await res.json()
      console.log('SocialFeed - Reddit API response:', data)
      if (data.success && data.posts) {
        console.log('SocialFeed - Setting Reddit posts:', data.posts.length)
        setRedditPosts(data.posts)
      } else {
        console.log('SocialFeed - No posts or failed:', data)
      }
    } catch (error) {
      console.error('Failed to fetch Reddit:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTwitter = async () => {
    try {
      const res = await fetch('/api/social/twitter')
      const data = await res.json()
      if (data.success) {
        setTweets(data.tweets)
      }
    } catch (error) {
      console.error('Failed to fetch Twitter:', error)
    }
  }

  const formatTimeAgo = (timestamp: number | string) => {
    const now = Date.now()
    const then = typeof timestamp === 'number' ? timestamp * 1000 : new Date(timestamp).getTime()
    const diff = now - then
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-tv-text">Social Buzz 🔥</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('reddit')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'reddit'
                ? 'bg-[#FF4500] text-white shadow-lg'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
            }`}
          >
            Reddit
          </button>
          <button
            onClick={() => setActiveTab('twitter')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'twitter'
                ? 'bg-[#1DA1F2] text-white shadow-lg'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
            }`}
          >
            X/Twitter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-tv-chip rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-tv-chip rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {activeTab === 'reddit' && redditPosts.length === 0 && (
            <div className="text-center py-8 text-tv-text-soft">
              No Reddit posts available
            </div>
          )}
          {activeTab === 'reddit' &&
            redditPosts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-tv-panel hover:bg-tv-hover rounded-lg border border-tv-grid transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-[#FF4500] bg-[#FF4500]/10 px-2 py-1 rounded">
                    r/{post.subreddit}
                  </span>
                  <ExternalLink className="w-3 h-3 text-tv-text-soft group-hover:text-tv-text transition-colors flex-shrink-0" />
                </div>
                <h3 className="text-sm font-medium text-tv-text mb-2 line-clamp-2 group-hover:text-tv-blue transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-tv-text-soft">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{formatNumber(post.score)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{formatNumber(post.numComments)}</span>
                  </div>
                  <span>u/{post.author}</span>
                  <span>• {formatTimeAgo(post.created)}</span>
                </div>
              </a>
            ))}

          {activeTab === 'twitter' &&
            tweets.map((tweet) => (
              <a
                key={tweet.id}
                href={tweet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-tv-panel hover:bg-tv-hover rounded-lg border border-tv-grid transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-tv-text">@{tweet.author}</span>
                  <ExternalLink className="w-3 h-3 text-tv-text-soft group-hover:text-tv-text transition-colors" />
                </div>
                <p className="text-sm text-tv-text mb-2 line-clamp-3">{tweet.text}</p>
                <div className="flex items-center gap-3 text-xs text-tv-text-soft">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{formatNumber(tweet.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    <span>{formatNumber(tweet.retweets)}</span>
                  </div>
                  <span>• {formatTimeAgo(tweet.createdAt)}</span>
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  )
}
