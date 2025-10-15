'use client'

import { useEffect, useState } from 'react'

interface TickerChipProps {
  symbol: string
}

interface PriceData {
  price: string
  change24h: string | null
  updatedAt: string
}

export default function TickerChip({ symbol }: TickerChipProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/ticker/${symbol}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.price) {
            setPriceData(data.price)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to fetch ticker price:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [symbol])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tv-chip text-tv-text rounded font-mono text-xs font-semibold">
        ${symbol}...
      </span>
    )
  }

  if (error || !priceData) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tv-chip text-tv-text rounded font-mono text-xs font-semibold">
        ${symbol}
      </span>
    )
  }

  const change = priceData.change24h ? parseFloat(priceData.change24h) : 0
  const isPositive = change >= 0
  const bgColor = isPositive ? 'bg-[#26A69A]' : 'bg-[#EF5350]'
  const arrow = isPositive ? '↑' : '↓'
  const changeText = isPositive ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`

  // Format updated time
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins === 1) return '1 min ago'
    if (diffMins < 60) return `${diffMins} mins ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`

    return date.toLocaleDateString()
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 ${bgColor} text-white rounded-md font-mono text-xs font-bold cursor-help transition-all hover:scale-105 shadow-sm`}
      title={`$${symbol} - Updated ${getTimeAgo(priceData.updatedAt)}`}
    >
      ${symbol} {arrow} {changeText}
    </span>
  )
}
