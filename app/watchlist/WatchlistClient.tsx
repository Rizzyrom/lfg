'use client'

import { useState, useEffect } from 'react'
import SkeletonRow from '@/components/SkeletonRow'

interface WatchItem {
  id: string
  symbol: string
  source: string
  tags: string[]
}

export default function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [symbol, setSymbol] = useState('')
  const [source, setSource] = useState<'crypto' | 'equity'>('crypto')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist')
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
        <h2 className="text-lg font-semibold text-tv-text mb-4">Add Symbol</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="BTC, AAPL, etc."
            className="input flex-1"
            disabled={adding}
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'crypto' | 'equity')}
            className="input"
            disabled={adding}
          >
            <option value="crypto">Crypto</option>
            <option value="equity">Equity</option>
          </select>
          <button type="submit" disabled={adding} className="btn btn-primary">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
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
          items.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-tv-text">{item.symbol}</h3>
                  <p className="text-sm text-tv-text-soft uppercase">{item.source}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn text-tv-down border-tv-down"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
