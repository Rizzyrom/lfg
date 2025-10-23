'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Newspaper, ExternalLink, TrendingUp, Minus, TrendingDown } from 'lucide-react'
import { NewsArticle } from '@/lib/marketDataAPI'

interface AssetNewsProps {
  symbol: string
  source: 'crypto' | 'stock'
  className?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function AssetNews({ symbol, source, className = '' }: AssetNewsProps) {
  const { data: articles, error, isLoading } = useSWR<NewsArticle[]>(
    `/api/asset-news?symbol=${symbol}&source=${source}`,
    fetcher,
    {
      refreshInterval: 600000, // Refresh every 10 minutes
      revalidateOnFocus: false,
      dedupingInterval: 120000,
    }
  )

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getSentimentIcon = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return <TrendingUp className="w-4 h-4 text-tv-up" />
    if (sentiment === 'negative') return <TrendingDown className="w-4 h-4 text-tv-down" />
    return <Minus className="w-4 h-4 text-tv-text-soft" />
  }

  const getSentimentBadge = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-tv-up/10 text-tv-up">
          Positive
        </span>
      )
    }
    if (sentiment === 'negative') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-tv-down/10 text-tv-down">
          Negative
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-tv-chip text-tv-text-soft">
        Neutral
      </span>
    )
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-tv-blue" />
          <h2 className="text-lg font-bold text-tv-text">Latest News</h2>
        </div>
        {articles && articles.length > 0 && (
          <span className="text-xs font-semibold text-tv-text-soft px-2 py-1 bg-tv-chip rounded">
            {articles.length} articles
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-tv-chip rounded w-3/4 mb-2" />
              <div className="h-3 bg-tv-chip rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-tv-text-soft mx-auto mb-3 opacity-50" />
          <p className="text-sm text-tv-text-soft">Failed to load news</p>
          <p className="text-xs text-tv-text-muted mt-1">Please try again later</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!articles || articles.length === 0) && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-tv-text-soft mx-auto mb-3 opacity-50" />
          <p className="text-sm text-tv-text-soft">No recent news available</p>
          <p className="text-xs text-tv-text-muted mt-1">Check back later for updates</p>
        </div>
      )}

      {/* News Articles */}
      {!isLoading && !error && articles && articles.length > 0 && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
          {articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-tv-border hover:border-tv-blue hover:shadow-elevation-2 transition-all group"
            >
              <div className="flex gap-3">
                {/* Article Image */}
                {article.image && (
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-tv-chip">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-tv-text group-hover:text-tv-blue transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h3>

                  {article.summary && (
                    <p className="text-xs text-tv-text-soft line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-tv-text-muted">
                    <span className="font-medium">{article.source}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                    {article.sentiment && (
                      <>
                        <span>•</span>
                        {getSentimentBadge(article.sentiment)}
                      </>
                    )}
                  </div>
                </div>

                {/* External Link Icon */}
                <div className="flex-shrink-0">
                  <ExternalLink className="w-4 h-4 text-tv-text-soft opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Update Info */}
      {!isLoading && !error && articles && articles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-tv-border">
          <p className="text-xs text-tv-text-soft text-center">
            Updates every 5 minutes • Filtered for {symbol}
          </p>
        </div>
      )}
    </div>
  )
}
