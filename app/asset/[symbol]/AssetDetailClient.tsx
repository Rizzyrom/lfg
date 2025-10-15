'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Newspaper } from 'lucide-react'
import Link from 'next/link'

interface AssetDetailClientProps {
  symbol: string
  source: string
}

interface NewsArticle {
  title: string
  url: string
  source: string
  publishedAt: string
}

export default function AssetDetailClient({ symbol, source }: AssetDetailClientProps) {
  const router = useRouter()
  const [price, setPrice] = useState<string | null>(null)
  const [change24h, setChange24h] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<NewsArticle[]>([])

  useEffect(() => {
    fetchAssetData()
  }, [symbol, source])

  const fetchAssetData = async () => {
    try {
      // Fetch price data
      const priceRes = await fetch(`/api/watchlist/prices?symbol=${symbol}&source=${source}`)
      if (priceRes.ok) {
        const data = await priceRes.json()
        if (data.items && data.items.length > 0) {
          setPrice(data.items[0].price)
          setChange24h(data.items[0].change24h)
        }
      }

      // Fetch news
      const newsRes = await fetch(`/api/news?symbol=${symbol}`)
      if (newsRes.ok) {
        const data = await newsRes.json()
        setNews(data.articles?.slice(0, 10) || [])
      }
    } catch (error) {
      console.error('Failed to fetch asset data:', error)
    } finally {
      setLoading(false)
    }
  }

  const change = change24h ? parseFloat(change24h) : 0
  const isPositive = change >= 0

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-tv-text-soft hover:text-tv-text transition-all mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Watchlist</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-tv-text">{symbol}</h1>
              <span className="px-3 py-1 rounded-full bg-tv-chip text-tv-text-soft text-sm font-medium uppercase">
                {source}
              </span>
            </div>
            {loading ? (
              <div className="h-8 w-48 bg-tv-chip animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-3">
                {price && (
                  <span className="text-2xl font-bold text-tv-text font-mono">
                    ${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {change24h && (
                  <div className={`flex items-center gap-1 text-lg font-semibold ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold text-tv-text mb-4">Performance</h2>
        <div className="relative h-64 bg-gradient-to-br from-tv-bg to-tv-chip rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-tv-blue mx-auto mb-3" />
            <p className="text-tv-text-soft text-sm">
              Chart integration coming soon
            </p>
            <p className="text-tv-text-soft text-xs mt-1">
              TradingView or similar charting library
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-tv-text-soft mb-1">24h Change</p>
          <p className={`text-lg font-bold ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
            {change24h ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : '--'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-tv-text-soft mb-1">Current Price</p>
          <p className="text-lg font-bold text-tv-text font-mono">
            {price ? `$${parseFloat(price).toFixed(2)}` : '--'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-tv-text-soft mb-1">Source</p>
          <p className="text-lg font-bold text-tv-text capitalize">{source}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-tv-text-soft mb-1">Type</p>
          <p className="text-lg font-bold text-tv-text">
            {source === 'crypto' ? 'Cryptocurrency' : 'Stock'}
          </p>
        </div>
      </div>

      {/* News Section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-tv-blue" />
          <h2 className="text-lg font-bold text-tv-text">Latest News</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-tv-chip animate-pulse rounded-lg" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-tv-text-soft mx-auto mb-3" />
            <p className="text-tv-text-soft">No recent news available for {symbol}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg border border-tv-border hover:border-tv-blue transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-tv-text text-sm mb-1 group-hover:text-tv-blue transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-tv-text-soft">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-tv-text-soft flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 flex gap-2">
        <Link
          href="/watchlist"
          className="px-6 py-3 rounded-full bg-tv-blue hover:bg-tv-blue-hover text-white font-medium shadow-elevation-3 transition-all active:scale-95"
        >
          Back to Watchlist
        </Link>
      </div>
    </div>
  )
}
