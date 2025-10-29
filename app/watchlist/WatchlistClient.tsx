'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import SkeletonRow from '@/components/SkeletonRow'
import AssetSearchBar from './AssetSearchBar'
import { useDataPrefetch } from '@/components/DataPrefetchProvider'

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

const STAGGER_INTERVAL = 5000 // 5 seconds between each item update
const REFRESH_CYCLE = 5 * 60 * 1000 // 5 minutes total cycle

interface WatchlistClientProps {
  isActive?: boolean
}

export default function WatchlistClient({ isActive = true }: WatchlistClientProps = {}) {
  const { getCachedData, setCachedData } = useDataPrefetch()

  // Initialize with cached data for instant display
  const [items, setItems] = useState<WatchItem[]>(() => {
    const cached = getCachedData('watchlist')
    return cached || []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCachedData('watchlist')
    return !cached // Only show loading if no cache
  })
  const [adding, setAdding] = useState(false)
  const pathname = usePathname()
  const updateTimersRef = useRef<NodeJS.Timeout[]>([])
  const isVisibleRef = useRef(true)
  const isFirstLoadRef = useRef(true)

  // Initial load: fetch ALL prices in parallel for fast first load
  const fetchAllPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist/prices')
      if (res.ok) {
        const data = await res.json()
        const freshItems = data.items || []
        setItems(freshItems)
        // Update cache with fresh data
        setCachedData('watchlist', freshItems)
        isFirstLoadRef.current = false
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }, [setCachedData])

  // Update price for a single item
  const updateItemPrice = useCallback(async (item: WatchItem) => {
    try {
      const res = await fetch(`/api/watchlist/price/${item.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.item) {
          setItems(prevItems =>
            prevItems.map(i =>
              i.id === item.id ? { ...i, ...data.item } : i
            )
          )
        }
      }
    } catch (error) {
      console.error(`Failed to update price for ${item.symbol}:`, error)
    }
  }, [])

  // Start staggered price updates
  const startStaggeredUpdates = useCallback((itemsList: WatchItem[]) => {
    // Clear existing timers
    updateTimersRef.current.forEach(timer => clearTimeout(timer))
    updateTimersRef.current = []

    if (itemsList.length === 0) return

    // Calculate stagger delay to spread updates across 5 minutes
    const staggerDelay = Math.min(STAGGER_INTERVAL, REFRESH_CYCLE / itemsList.length)

    // Schedule updates for each item
    itemsList.forEach((item, index) => {
      const initialDelay = index * staggerDelay

      // Initial update
      const initialTimer = setTimeout(() => {
        if (isVisibleRef.current) {
          updateItemPrice(item)
        }
      }, initialDelay)

      updateTimersRef.current.push(initialTimer)

      // Recurring updates every 5 minutes
      const recurringTimer = setInterval(() => {
        if (isVisibleRef.current) {
          updateItemPrice(item)
        }
      }, REFRESH_CYCLE)

      updateTimersRef.current.push(recurringTimer as any)
    })
  }, [updateItemPrice])

  // Handle visibility changes (page visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      // When page becomes visible, trigger immediate updates for stale prices
      if (isVisibleRef.current && items.length > 0 && !isFirstLoadRef.current) {
        items.forEach((item, index) => {
          setTimeout(() => updateItemPrice(item), index * 100) // Quick stagger
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [items, updateItemPrice])

  // Initial load: fetch all prices in parallel ONLY when active
  useEffect(() => {
    if (isFirstLoadRef.current && isActive) {
      fetchAllPrices()
    }
  }, [fetchAllPrices, isActive])

  // Start staggered updates AFTER first load completes
  useEffect(() => {
    if (items.length > 0 && !loading && !isFirstLoadRef.current) {
      startStaggeredUpdates(items)
    }

    return () => {
      updateTimersRef.current.forEach(timer => clearTimeout(timer))
      updateTimersRef.current = []
    }
  }, [items.length, loading, startStaggeredUpdates])

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
        // Fetch all prices again to immediately show the new item
        await fetchAllPrices()
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

  // Render asset bubble component with modern card design
  const renderAssetBubble = (item: WatchItem) => {
    const change24h = item.change24h ? parseFloat(item.change24h) : 0
    const change30d = item.change30d ? parseFloat(item.change30d) : 0
    const isPositive24h = change24h >= 0
    const isPositive30d = change30d >= 0

    return (
      <div
        key={item.id}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl active:scale-[0.98] min-h-[100px] flex flex-col justify-between relative overflow-hidden"
        style={{
          border: `2px solid ${
            item.price
              ? isPositive24h
                ? '#10b981'  // tv-up green
                : '#ef4444'  // tv-down red
              : 'rgba(0, 0, 0, 0.08)'  // neutral gray
          }`,
          boxShadow: item.price ? (isPositive24h ? '0 4px 20px rgba(16, 185, 129, 0.15)' : '0 4px 20px rgba(239, 68, 68, 0.15)') : 'none'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />

        <Link
          href={`/asset/${encodeURIComponent(item.symbol)}?source=${item.source}`}
          className="block w-full h-full flex flex-col justify-between relative z-10"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-tv-text truncate">{item.symbol}</h3>
            {item.mentionCount && item.mentionCount > 0 && (
              <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-md flex-shrink-0 ml-2">
                {item.mentionCount}
              </span>
            )}
          </div>
          {item.price && (
            <div className="flex flex-col gap-1.5">
              <span className="text-base font-mono font-bold text-tv-text">
                ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-tv-bg/50">
                  <span className="text-tv-text-muted">24h</span>
                  <span className={`${isPositive24h ? 'text-tv-up' : 'text-tv-down'} font-bold`}>
                    {isPositive24h ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-tv-bg/50">
                  <span className="text-tv-text-muted">30d</span>
                  <span className={`${isPositive30d ? 'text-tv-up' : 'text-tv-down'} font-bold`}>
                    {isPositive30d ? '+' : ''}{change30d.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {!item.price && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-tv-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-tv-text-soft font-medium">Loading price...</p>
            </div>
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
          <div className="bg-gradient-to-br from-tv-panel to-tv-bg rounded-2xl p-10 text-center shadow-sm border border-tv-grid/30">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-tv-blue/20 to-tv-blue/5 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-tv-blue" />
            </div>
            <p className="text-tv-text font-semibold text-lg mb-2">
              Your watchlist is empty
            </p>
            <p className="text-tv-text-soft text-sm">
              Add symbols above to start tracking your favorite assets
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
