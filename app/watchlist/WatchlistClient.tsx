'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
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

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist/prices', {
        next: { revalidate: 60 }, // Cache for 1 minute
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWatchlist()
    // Optimized: refresh every 60 seconds instead of 30
    const interval = setInterval(fetchWatchlist, 60000)
    return () => clearInterval(interval)
  }, [fetchWatchlist])

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


  // Memoize separated items for performance
  const stockItems = useMemo(() =>
    items.filter(item => item.source === 'stock'),
    [items]
  )
  const cryptoItems = useMemo(() =>
    items.filter(item => item.source === 'crypto'),
    [items]
  )

  // Render asset bubble component
  const renderAssetBubble = (item: WatchItem) => {
    const change24h = item.change24h ? parseFloat(item.change24h) : 0
    const change30d = item.change30d ? parseFloat(item.change30d) : 0
    const isPositive24h = change24h >= 0
    const isPositive30d = change30d >= 0

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl p-3 transition-all hover:shadow-elevation-2 min-h-[80px] flex flex-col justify-between"
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
        <Link
          href={`/asset/${encodeURIComponent(item.symbol)}?source=${item.source}`}
          className="block w-full h-full flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-tv-text truncate">{item.symbol}</h3>
            {item.mentionCount && item.mentionCount > 0 && (
              <span className="text-[0.5rem] leading-none text-red-600 font-bold ml-2 flex-shrink-0">
                {item.mentionCount}
              </span>
            )}
          </div>
          {item.price && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-mono font-semibold text-tv-text">
                ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium flex-wrap">
                <div className="flex items-center gap-0.5">
                  <span className="text-tv-text-soft">D</span>
                  <span className={isPositive24h ? 'text-tv-up' : 'text-tv-down'}>
                    {isPositive24h ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                </div>
                <span className="text-tv-text-soft">|</span>
                <div className="flex items-center gap-0.5">
                  <span className="text-tv-text-soft">M</span>
                  <span className={isPositive30d ? 'text-tv-up' : 'text-tv-down'}>
                    {isPositive30d ? '+' : ''}{change30d.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {!item.price && (
            <p className="text-xs text-tv-text-soft">Loading...</p>
          )}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar - Fixed at top */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex justify-end">
          <div className="w-full sm:w-64">
            <AssetSearchBar onAdd={handleAdd} disabled={adding} />
          </div>
        </div>
      </div>

      {/* Content area - Scrollable columns */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-tv-text-soft">
              Your watchlist is empty. Add symbols above to start tracking.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 h-full">
            {/* Stocks Column - Left */}
            <div className="flex flex-col h-full overflow-hidden">
              <h2 className="text-base font-bold text-tv-text mb-2 px-1 flex-shrink-0">Stocks</h2>
              <div
                className="space-y-2 overflow-y-auto snap-y snap-mandatory flex-1 pb-2 scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
              >
                <div className="h-0 snap-start" />
                {stockItems.length === 0 ? (
                  <div className="bg-tv-panel rounded-xl p-6 text-center">
                    <p className="text-tv-text-soft text-sm">No stocks in watchlist</p>
                  </div>
                ) : (
                  stockItems.map(renderAssetBubble)
                )}
                <div className="h-0 snap-end" />
              </div>
            </div>

            {/* Crypto Column - Right */}
            <div className="flex flex-col h-full overflow-hidden">
              <h2 className="text-base font-bold text-tv-text mb-2 px-1 flex-shrink-0">Crypto</h2>
              <div
                className="space-y-2 overflow-y-auto snap-y snap-mandatory flex-1 pb-2 scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
              >
                <div className="h-0 snap-start" />
                {cryptoItems.length === 0 ? (
                  <div className="bg-tv-panel rounded-xl p-6 text-center">
                    <p className="text-tv-text-soft text-sm">No crypto in watchlist</p>
                  </div>
                ) : (
                  cryptoItems.map(renderAssetBubble)
                )}
                <div className="h-0 snap-end" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
