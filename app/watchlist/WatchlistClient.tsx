'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SkeletonRow from '@/components/SkeletonRow'
import AssetSearchBar from './AssetSearchBar'

interface WatchItem {
  id: string
  symbol: string
  source: string
  tags: string[]
  price?: string | null
  change24h?: string | null
  change30d?: string | null
  mentionCount?: number
}

export default function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchWatchlist()
    // Auto-refresh prices every 30 seconds
    const interval = setInterval(fetchWatchlist, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist/prices')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (symbol: string, source: 'crypto' | 'stock') => {
    if (!symbol.trim()) return

    setAdding(true)
    try {
      console.log('Adding watchlist item:', { symbol, source })
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), source }),
      })

      const data = await res.json()
      console.log('Add watchlist response:', { ok: res.ok, status: res.status, data })

      if (res.ok) {
        await fetchWatchlist()
      } else {
        console.error('Failed to add item:', data)
        alert(data.error || 'Failed to add item. Please try again.')
      }
    } catch (error) {
      console.error('Failed to add item:', error)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from watchlist?')) return

    try {
      const res = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchWatchlist()
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  return (
    <div>
      <div>
        {/* Search bar */}
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-full sm:w-64">
              <AssetSearchBar onAdd={handleAdd} disabled={adding} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : items.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-tv-text-soft">
                Your watchlist is empty. Add symbols above to start tracking.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const change24h = item.change24h ? parseFloat(item.change24h) : 0
              const change30d = item.change30d ? parseFloat(item.change30d) : 0
              const isPositive24h = change24h >= 0
              const isPositive30d = change30d >= 0

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 transition-all hover:shadow-elevation-2"
                  style={{
                    border: `3px solid ${
                      item.price
                        ? isPositive24h
                          ? '#10b981'  // tv-up green
                          : '#ef4444'  // tv-down red
                        : 'rgba(0, 0, 0, 0.1)'  // neutral gray
                    }`
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/asset/${encodeURIComponent(item.symbol)}?source=${item.source}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-tv-text">{item.symbol}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-tv-chip text-tv-text-soft uppercase self-center">
                          {item.source}
                        </span>
                        {item.mentionCount && item.mentionCount > 0 && (
                          <span className="text-[0.5rem] leading-none text-red-600 font-bold">
                            {item.mentionCount}
                          </span>
                        )}
                      </div>
                      {item.price && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="text-base font-mono font-semibold text-tv-text">
                            ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <span className={isPositive24h ? 'text-tv-up' : 'text-tv-down'}>
                              {isPositive24h ? '+' : ''}{change24h.toFixed(2)}%
                            </span>
                            <span className="text-tv-text-soft text-xs">d</span>
                            <span className="text-tv-text-soft">|</span>
                            <span className="text-tv-text-soft text-xs">m</span>
                            <span className={isPositive30d ? 'text-tv-up' : 'text-tv-down'}>
                              {isPositive30d ? '+' : ''}{change30d.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                      {!item.price && (
                        <p className="text-sm text-tv-text-soft">Loading...</p>
                      )}
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-1 rounded-lg bg-tv-panel hover:bg-red-50 text-tv-text-soft hover:text-tv-down text-xs font-medium transition-all active:scale-95 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
