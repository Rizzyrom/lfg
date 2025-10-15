'use client'

import { useState, useEffect } from 'react'
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
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), source }),
      })

      if (res.ok) {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tv-text">Watchlist</h1>
        <p className="text-sm text-tv-text-soft mt-1">
          Manage symbols to track
        </p>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold text-tv-text mb-4">Add Asset to Watchlist</h2>
        <AssetSearchBar onAdd={handleAdd} disabled={adding} />
      </div>

      <div className="space-y-3">
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
              <div key={item.id} className="card p-4 hover:border-tv-blue transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-tv-text">{item.symbol}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-tv-chip text-tv-text-soft uppercase">
                        {item.source}
                      </span>
                    </div>
                    {item.price && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-mono font-bold text-tv-text">
                          ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-sm font-semibold ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {!item.price && (
                      <p className="text-sm text-tv-text-soft">Loading price...</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all active:scale-95"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
