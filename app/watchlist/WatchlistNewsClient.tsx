'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface WatchItem {
  id: string
  symbol: string
  source: string
  tags: string[]
  price?: string | null
  change24h?: string | null
}

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export default function WatchlistNewsClient() {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [symbol, setSymbol] = useState('')
  const [source, setSource] = useState<'crypto' | 'stock'>('crypto')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchWatchlist()
      fetchNews()
    }, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchWatchlist(), fetchNews()])
    setLoading(false)
  }

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist/prices')
      if (res.ok) {
        const data = await res.json()
        setWatchlist(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    }
  }

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      if (res.ok) {
        const data = await res.json()
        setNews(data.articles || [])
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symbol.trim()) return

    setAdding(true)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), source }),
      })

      if (res.ok) {
        setSymbol('')
        await fetchWatchlist()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add item')
      }
    } catch (error) {
      console.error('Failed to add item:', error)
      alert('Failed to add item')
    } finally {
      setAdding(false)
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

  // Filter news relevant to watchlist symbols
  const relevantNews = news.filter(article => {
    const articleText = `${article.title} ${article.description}`.toLowerCase()
    return watchlist.some(item => articleText.includes(item.symbol.toLowerCase()))
  })

  const otherNews = news.filter(article => !relevantNews.includes(article))

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-tv-text mb-2">Watchlist</h1>
        <p className="text-sm text-tv-text-soft">
          News and updates about your watched assets
        </p>
      </div>

      {/* Add to Watchlist */}
      <div className="card p-3 sm:p-4 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-tv-text mb-3">Add to Watchlist</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="BTC, AAPL, etc."
            className="input flex-1 text-sm sm:text-base"
            disabled={adding}
          />
          <div className="flex gap-2">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as 'crypto' | 'stock')}
              className="input flex-1 sm:flex-none text-sm sm:text-base"
              disabled={adding}
            >
              <option value="crypto">Crypto</option>
              <option value="stock">Stock</option>
            </select>
            <button type="submit" disabled={adding} className="btn btn-primary px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap">
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-tv-chip rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Relevant News */}
          {relevantNews.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-tv-text mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-tv-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Watchlist News
              </h2>
              <div className="space-y-3">
                {relevantNews.slice(0, 5).map((article, index) => (
                  <a
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card p-3 sm:p-4 hover:border-tv-blue transition block group"
                  >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {article.imageUrl && (
                        <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-tv-chip">
                          <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs px-2 py-1 rounded bg-tv-blue/20 text-tv-blue font-medium whitespace-nowrap">
                            {article.source}
                          </span>
                          <span className="text-xs text-tv-text-soft whitespace-nowrap">
                            {getTimeAgo(article.publishedAt)}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-tv-text mb-2 group-hover:text-tv-blue transition line-clamp-3 sm:line-clamp-2">
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
                ))}
              </div>
            </div>
          )}

          {/* Other Market News */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-tv-text mb-3 sm:mb-4">Market News</h2>
            <div className="space-y-3">
              {otherNews.slice(0, 10).map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-3 sm:p-4 hover:border-tv-blue transition block group"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {article.imageUrl && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-tv-chip">
                        <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded bg-tv-chip text-tv-text-soft font-medium whitespace-nowrap">
                          {article.source}
                        </span>
                        <span className="text-xs text-tv-text-soft whitespace-nowrap">
                          {getTimeAgo(article.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-tv-text mb-1 group-hover:text-tv-blue transition line-clamp-2">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-xs sm:text-sm text-tv-text-soft line-clamp-1">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
