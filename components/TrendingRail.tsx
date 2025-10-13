'use client'

import { useState, useEffect } from 'react'

interface TrendingItem {
  symbol: string
  name: string
  price: number
  change24h: number
  volume?: number
  marketCap?: number
  source: 'crypto' | 'stock'
}

export default function TrendingRail() {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'gainers' | 'losers'>('gainers')
  const [filter, setFilter] = useState<'all' | 'crypto' | 'stock'>('all')

  useEffect(() => {
    fetchTrending()
    const interval = setInterval(fetchTrending, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/trending')
      if (res.ok) {
        const data = await res.json()
        setItems(data.trending || [])
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items
    .filter(item => {
      if (filter === 'crypto') return item.source === 'crypto'
      if (filter === 'stock') return item.source === 'stock'
      return true
    })
    .filter(item => {
      if (view === 'gainers') return item.change24h > 0
      return item.change24h < 0
    })
    .slice(0, 10)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-tv-text">Trending</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setView('gainers')}
              className={`px-2 py-1 text-xs font-medium rounded transition ${
                view === 'gainers'
                  ? 'bg-tv-up text-white'
                  : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setView('losers')}
              className={`px-2 py-1 text-xs font-medium rounded transition ${
                view === 'losers'
                  ? 'bg-tv-down text-white'
                  : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
              filter === 'all'
                ? 'bg-tv-blue text-white'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('crypto')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
              filter === 'crypto'
                ? 'bg-tv-blue text-white'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setFilter('stock')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
              filter === 'stock'
                ? 'bg-tv-blue text-white'
                : 'bg-tv-chip text-tv-text-soft hover:text-tv-text'
            }`}
          >
            Stocks
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-tv-chip rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-sm text-tv-text-soft">No {view} found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, index) => {
            const isPositive = item.change24h >= 0
            return (
              <div
                key={`${item.symbol}-${item.source}`}
                className="p-3 bg-tv-chip rounded-lg hover:bg-tv-hover transition cursor-pointer border border-transparent hover:border-tv-blue"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-tv-text-soft">#{index + 1}</span>
                    <span className="text-sm font-bold text-tv-text">{item.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-tv-grid text-tv-text-soft uppercase">
                      {item.source}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
                    {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
                  </span>
                </div>
                <div className="text-sm font-mono text-tv-text">
                  ${item.price >= 1
                    ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : item.price.toFixed(6)}
                </div>
                {item.marketCap && (
                  <div className="text-[10px] text-tv-text-soft mt-1">
                    MCap: ${(item.marketCap / 1e9).toFixed(2)}B
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
