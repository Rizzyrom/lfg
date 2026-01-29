'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TickerChipProps {
  symbol: string
}

interface PriceData {
  price: number
  change24h: number
}

// Simple cache to avoid repeated API calls
const priceCache: Record<string, { data: PriceData; timestamp: number }> = {}
const CACHE_TTL = 60000 // 1 minute

export default function TickerChip({ symbol }: TickerChipProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      // Check cache first
      const cached = priceCache[symbol]
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setPriceData(cached.data)
        setLoading(false)
        return
      }

      try {
        // Try to get price from our API
        const res = await fetch(`/api/price-cache?symbol=${symbol}`)
        if (res.ok) {
          const data = await res.json()
          if (data.price) {
            const priceInfo = {
              price: parseFloat(data.price),
              change24h: parseFloat(data.change24h || '0')
            }
            priceCache[symbol] = { data: priceInfo, timestamp: Date.now() }
            setPriceData(priceInfo)
          }
        }
      } catch (error) {
        console.error('Failed to fetch price for', symbol, error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [symbol])

  const isPositive = priceData && priceData.change24h >= 0
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(4)}`
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-tv-bg-secondary hover:bg-tv-chip transition-colors cursor-pointer"
      title={priceData ? `${symbol}: ${formatPrice(priceData.price)} (${isPositive ? '+' : ''}${priceData.change24h.toFixed(2)}%)` : symbol}
    >
      <span className="text-tv-blue font-bold">${symbol}</span>
      {loading ? (
        <span className="text-tv-text-muted">...</span>
      ) : priceData ? (
        <>
          <span className="text-tv-text">{formatPrice(priceData.price)}</span>
          <span className={`flex items-center gap-0.5 ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(priceData.change24h).toFixed(1)}%</span>
          </span>
        </>
      ) : (
        <span className="text-tv-text-muted">–</span>
      )}
    </span>
  )
}
