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
        {/* Header with compact search in upper right */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-tv-text">Watchlist</h1>
            <p className="text-sm text-tv-text-soft mt-1">
              Click an asset to view details
            </p>
          </div>

          {/* Compact search bar - upper right */}
          <div className="flex-shrink-0 w-64">
            <AssetSearchBar onAdd={handleAdd} disabled={adding} />
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
              const change = item.change24h ? parseFloat(item.change24h) : 0
              const isPositive = change >= 0

              return (
                <Link
                  key={item.id}
                  href={`/asset/${encodeURIComponent(item.symbol)}?source=${item.source}`}
                  className="w-full card p-4 text-left transition-all cursor-pointer hover:border-tv-blue hover:shadow-elevation-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-tv-text">{item.symbol}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-tv-chip text-tv-text-soft uppercase">
                          {item.source}
                        </span>
                      </div>
                      {item.price && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-mono font-semibold text-tv-text">
                            ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-sm font-medium ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      {!item.price && (
                        <p className="text-sm text-tv-text-soft">Loading...</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-tv-down text-xs font-medium transition-all active:scale-95"
                    >
                      Remove
                    </button>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
