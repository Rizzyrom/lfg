'use client'

import { useState, useEffect } from 'react'
import FeedCard from '@/components/FeedCard'
import SkeletonRow from '@/components/SkeletonRow'

interface Price {
  symbol: string
  source: string
  price: string
  change24h: string | null
  updatedAt: string
}

export default function FeedClient() {
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/price-cache')
      if (res.ok) {
        const data = await res.json()
        setPrices(data.prices || [])
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tv-text">Market Feed</h1>
        <p className="text-sm text-tv-text-soft mt-1">
          Live prices from your watchlist
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : prices.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-tv-text-soft">
              No market data available. Add items to your watchlist and click Refresh.
            </p>
          </div>
        ) : (
          prices.map((price) => (
            <FeedCard
              key={`${price.symbol}-${price.source}`}
              symbol={price.symbol}
              source={price.source}
              price={price.price}
              change24h={price.change24h}
              updatedAt={price.updatedAt}
            />
          ))
        )}
      </div>
    </div>
  )
}
