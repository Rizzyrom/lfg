'use client'

import { useState, useEffect } from 'react'
import SkeletonRow from '@/components/SkeletonRow'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export default function FeedClient() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
    // Auto-refresh news every 5 minutes
    const interval = setInterval(fetchNews, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const shareToChat = async (title: string, url: string) => {
    try {
      const message = `📰 ${title}\n${url}`
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (res.ok) {
        alert('Shared to chat!')
      } else {
        alert('Failed to share')
      }
    } catch (error) {
      console.error('Failed to share:', error)
      alert('Failed to share')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tv-text">Market News Feed</h1>
        <p className="text-sm text-tv-text-soft mt-1">
          Latest crypto and stock market news
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : articles.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-tv-text-soft">
              No news available at the moment.
            </p>
          </div>
        ) : (
          articles.map((article, index) => (
            <div key={index} className="card p-4 hover:border-tv-blue transition group">
              <div className="flex gap-4">
                {article.imageUrl && (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-tv-chip">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-tv-blue/20 text-tv-blue font-medium">
                      {article.source}
                    </span>
                    <span className="text-xs text-tv-text-soft">
                      {getTimeAgo(article.publishedAt)}
                    </span>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="text-lg font-bold text-tv-text mb-2 group-hover:text-tv-blue transition line-clamp-2">
                      {article.title}
                    </h3>
                  </a>
                  {article.description && (
                    <p className="text-sm text-tv-text-soft line-clamp-2 mb-2">
                      {article.description}
                    </p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      shareToChat(article.title, article.url)
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded bg-tv-chip hover:bg-tv-blue hover:text-white transition"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Share to Chat
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
