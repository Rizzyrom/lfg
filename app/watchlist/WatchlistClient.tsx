'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Star, ArrowUpRight, Loader2 } from 'lucide-react'
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

const STAGGER_INTERVAL = 5000
const REFRESH_CYCLE = 5 * 60 * 1000

type TimerRefs = {
  timeouts: NodeJS.Timeout[]
  intervals: NodeJS.Timeout[]
}

interface WatchlistClientProps {
  isActive?: boolean
}

export default function WatchlistClient({ isActive = true }: WatchlistClientProps = {}) {
  const { getCachedData, setCachedData } = useDataPrefetch()

  const [items, setItems] = useState<WatchItem[]>(() => {
    const cached = getCachedData('watchlist')
    return cached || []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCachedData('watchlist')
    return !cached
  })
  const [adding, setAdding] = useState(false)
  const updateTimersRef = useRef<TimerRefs>({ timeouts: [], intervals: [] })
  const isVisibleRef = useRef(true)
  const isFirstLoadRef = useRef(true)
  const pendingRequestsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const cached = getCachedData('watchlist')
    if (cached && cached.length > 0 && items.length === 0) {
      setItems(cached)
      setLoading(false)
    }
  }, [getCachedData, items.length])

  const fetchAllPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist/prices')
      if (res.ok) {
        const data = await res.json()
        const freshItems = data.items || []
        setItems(freshItems)
        setCachedData('watchlist', freshItems)
        isFirstLoadRef.current = false
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }, [setCachedData])

  const updateItemPrice = useCallback(async (item: WatchItem) => {
    if (pendingRequestsRef.current.has(item.id)) return

    pendingRequestsRef.current.add(item.id)

    try {
      const res = await fetch(`/api/watchlist/price/${item.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.item) {
          setItems(prevItems =>
            prevItems.map(i => i.id === item.id ? { ...i, ...data.item } : i)
          )
        }
      }
    } catch (error) {
      console.error(`Failed to update price for ${item.symbol}:`, error)
    } finally {
      pendingRequestsRef.current.delete(item.id)
    }
  }, [])

  const clearAllTimers = useCallback(() => {
    updateTimersRef.current.timeouts.forEach(timer => clearTimeout(timer))
    updateTimersRef.current.intervals.forEach(timer => clearInterval(timer))
    updateTimersRef.current = { timeouts: [], intervals: [] }
  }, [])

  const startStaggeredUpdates = useCallback((itemsList: WatchItem[]) => {
    clearAllTimers()
    if (itemsList.length === 0) return

    const staggerDelay = Math.min(STAGGER_INTERVAL, REFRESH_CYCLE / itemsList.length)

    itemsList.forEach((item, index) => {
      const initialDelay = index * staggerDelay

      const initialTimer = setTimeout(() => {
        if (isVisibleRef.current) {
          updateItemPrice(item)
        }
      }, initialDelay)

      updateTimersRef.current.timeouts.push(initialTimer)

      const recurringTimer = setInterval(() => {
        if (isVisibleRef.current) {
          updateItemPrice(item)
        }
      }, REFRESH_CYCLE)

      updateTimersRef.current.intervals.push(recurringTimer)
    })
  }, [updateItemPrice, clearAllTimers])

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (isVisibleRef.current && items.length > 0 && !isFirstLoadRef.current) {
        items.forEach((item, index) => {
          setTimeout(() => updateItemPrice(item), index * 100)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [items, updateItemPrice])

  useEffect(() => {
    if (!isActive) return

    if (isFirstLoadRef.current) {
      const cached = getCachedData('watchlist')
      if (!cached || cached.length === 0) {
        fetchAllPrices()
      } else {
        setItems(cached)
        setLoading(false)
        isFirstLoadRef.current = false
        setTimeout(() => fetchAllPrices(), 1000)
      }
    }
  }, [fetchAllPrices, isActive, getCachedData])

  useEffect(() => {
    if (items.length > 0 && !loading && !isFirstLoadRef.current) {
      startStaggeredUpdates(items)
    }

    return () => clearAllTimers()
  }, [items.length, loading, startStaggeredUpdates, clearAllTimers])

  const handleAdd = async (symbol: string, source: 'crypto' | 'stock') => {
    if (!symbol.trim()) return

    setAdding(true)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), source }),
      })

      const data = await res.json()

      if (res.ok) {
        await fetchAllPrices()
      } else {
        alert(data.error || 'Failed to add item. Please try again.')
      }
    } catch (error) {
      console.error('Failed to add item:', error)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setAdding(false)
    }
  }

  const stockItems = useMemo(() => items.filter(item => item.source === 'stock'), [items])
  const cryptoItems = useMemo(() => items.filter(item => item.source === 'crypto'), [items])

  const renderAssetCard = (item: WatchItem, index: number) => {
    const change24h = item.change24h ? parseFloat(item.change24h) : 0
    const change30d = item.change30d ? parseFloat(item.change30d) : 0
    const isPositive24h = change24h >= 0
    const isPositive30d = change30d >= 0

    return (
      <Link
        key={item.id}
        href={`/asset/${encodeURIComponent(item.symbol)}?source=${item.source}`}
        className="block animate-fade-in-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="bg-white rounded-2xl p-4 border border-tv-border hover:border-tv-blue/30 hover:shadow-lg transition-all duration-300 active:scale-[0.98] group">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-tv-text group-hover:text-tv-blue transition-colors">
                {item.symbol}
              </h3>
              {item.mentionCount && item.mentionCount > 0 && (
                <span className="px-2 py-0.5 bg-tv-down text-white text-[10px] font-bold rounded-full">
                  {item.mentionCount} mentions
                </span>
              )}
            </div>
            <ArrowUpRight className="w-4 h-4 text-tv-text-muted group-hover:text-tv-blue transition-colors" />
          </div>

          {/* Price */}
          {item.price ? (
            <div className="space-y-3">
              <div className="text-2xl font-bold font-mono text-tv-text">
                ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* Changes */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg ${
                  isPositive24h ? 'bg-tv-up-soft' : 'bg-tv-down-soft'
                }`}>
                  {isPositive24h ? (
                    <TrendingUp className="w-3.5 h-3.5 text-tv-up" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-tv-down" />
                  )}
                  <span className={`text-xs font-bold ${isPositive24h ? 'text-tv-up' : 'text-tv-down'}`}>
                    {isPositive24h ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-tv-text-muted font-medium ml-0.5">24h</span>
                </div>

                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg ${
                  isPositive30d ? 'bg-tv-up-soft' : 'bg-tv-down-soft'
                }`}>
                  {isPositive30d ? (
                    <TrendingUp className="w-3.5 h-3.5 text-tv-up" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-tv-down" />
                  )}
                  <span className={`text-xs font-bold ${isPositive30d ? 'text-tv-up' : 'text-tv-down'}`}>
                    {isPositive30d ? '+' : ''}{change30d.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-tv-text-muted font-medium ml-0.5">30d</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-tv-blue animate-spin" />
              <span className="text-sm text-tv-text-soft font-medium">Loading price...</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-end">
          <div className="w-full sm:w-72">
            <AssetSearchBar onAdd={handleAdd} disabled={adding} />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-tv-border animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-tv-blue-soft flex items-center justify-center">
              <Star className="w-8 h-8 text-tv-blue" />
            </div>
            <h3 className="text-lg font-bold text-tv-text mb-2">
              Your watchlist is empty
            </h3>
            <p className="text-tv-text-soft text-sm max-w-xs mx-auto">
              Search and add your favorite stocks and crypto to start tracking them
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full overflow-hidden">
            {/* Stocks Column */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-3 px-1 flex-shrink-0">
                <h2 className="text-sm font-bold text-tv-text uppercase tracking-wide">Stocks</h2>
                <span className="px-2 py-0.5 bg-tv-bg-secondary rounded-full text-xs font-semibold text-tv-text-soft">
                  {stockItems.length}
                </span>
              </div>
              <div
                className="space-y-3 overflow-y-auto flex-1 pb-20 scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
              >
                {stockItems.length === 0 ? (
                  <div className="bg-tv-bg-secondary rounded-xl p-6 text-center">
                    <p className="text-tv-text-soft text-sm">No stocks added yet</p>
                  </div>
                ) : (
                  stockItems.map((item, index) => renderAssetCard(item, index))
                )}
              </div>
            </div>

            {/* Crypto Column */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-3 px-1 flex-shrink-0">
                <h2 className="text-sm font-bold text-tv-text uppercase tracking-wide">Crypto</h2>
                <span className="px-2 py-0.5 bg-tv-bg-secondary rounded-full text-xs font-semibold text-tv-text-soft">
                  {cryptoItems.length}
                </span>
              </div>
              <div
                className="space-y-3 overflow-y-auto flex-1 pb-20 scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
              >
                {cryptoItems.length === 0 ? (
                  <div className="bg-tv-bg-secondary rounded-xl p-6 text-center">
                    <p className="text-tv-text-soft text-sm">No crypto added yet</p>
                  </div>
                ) : (
                  cryptoItems.map((item, index) => renderAssetCard(item, index))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
