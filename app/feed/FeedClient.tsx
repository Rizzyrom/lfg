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
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 hover:border-tv-blue transition block group"
            >
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
                  <h3 className="text-lg font-bold text-tv-text mb-2 group-hover:text-tv-blue transition line-clamp-2">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-tv-text-soft line-clamp-2">
                      {article.description}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
