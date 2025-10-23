'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { MarketData } from '@/lib/marketDataAPI'
import { TrendingUp, TrendingDown, DollarSign, Activity, Layers, Calendar } from 'lucide-react'

interface MarketDataPanelProps {
  symbol: string
  source: 'crypto' | 'stock'
  className?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function MarketDataPanel({ symbol, source, className = '' }: MarketDataPanelProps) {
  const { data: marketData, error, isLoading } = useSWR<MarketData>(
    `/api/market-data?symbol=${symbol}&source=${source}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  const { data: earnings } = useSWR<{ nextEarnings: string | null }>(
    source === 'stock' ? `/api/earnings?symbol=${symbol}` : null,
    fetcher,
    {
      refreshInterval: 86400000, // Refresh daily
    }
  )

  if (isLoading) {
    return (
      <div className={`card p-6 ${className}`}>
        <h2 className="text-lg font-bold text-tv-text mb-4">Market Data</h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-tv-chip rounded w-20 mb-2" />
              <div className="h-6 bg-tv-chip rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !marketData) {
    return (
      <div className={`card p-6 ${className}`}>
        <h2 className="text-lg font-bold text-tv-text mb-4">Market Data</h2>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-tv-text-soft mx-auto mb-3 opacity-50" />
          <p className="text-sm text-tv-text-soft">Failed to load market data</p>
        </div>
      </div>
    )
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-tv-blue" />
        <h2 className="text-lg font-bold text-tv-text">Market Data</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Current Price */}
        <div className="p-4 rounded-lg bg-tv-bg-secondary">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-tv-text-soft" />
            <p className="text-xs text-tv-text-soft font-medium">Current Price</p>
          </div>
          <p className="text-lg font-bold text-tv-text price">
            ${marketData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* 24h Change */}
        <div className="p-4 rounded-lg bg-tv-bg-secondary">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-tv-text-soft" />
            <p className="text-xs text-tv-text-soft font-medium">24h Change</p>
          </div>
          <div className={`flex items-center gap-1 text-lg font-bold ${marketData.change24h >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
            {marketData.change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>
              {marketData.change24h >= 0 ? '+' : ''}
              {marketData.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Market Cap */}
        {marketData.marketCap && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">Market Cap</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">{formatLargeNumber(marketData.marketCap)}</p>
          </div>
        )}

        {/* 24h Volume */}
        {marketData.volume24h && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">24h Volume</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">{formatLargeNumber(marketData.volume24h)}</p>
          </div>
        )}

        {/* Circulating Supply (Crypto) */}
        {source === 'crypto' && marketData.circulatingSupply && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">Circulating Supply</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">{formatNumber(marketData.circulatingSupply)}</p>
            {marketData.totalSupply && (
              <p className="text-xs text-tv-text-muted mt-0.5">
                of {formatNumber(marketData.totalSupply)} total
              </p>
            )}
          </div>
        )}

        {/* All-Time High (Crypto) */}
        {source === 'crypto' && marketData.ath && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">All-Time High</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">
              ${marketData.ath.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {marketData.athDate && (
              <p className="text-xs text-tv-text-muted mt-0.5">{formatDate(marketData.athDate)}</p>
            )}
          </div>
        )}

        {/* All-Time Low (Crypto) */}
        {source === 'crypto' && marketData.atl && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">All-Time Low</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">
              ${marketData.atl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {marketData.atlDate && (
              <p className="text-xs text-tv-text-muted mt-0.5">{formatDate(marketData.atlDate)}</p>
            )}
          </div>
        )}

        {/* 52-Week High (Stocks) */}
        {source === 'stock' && marketData.high52w && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">52-Week High</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">
              ${marketData.high52w.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* 52-Week Low (Stocks) */}
        {source === 'stock' && marketData.low52w && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">52-Week Low</p>
            </div>
            <p className="text-lg font-bold text-tv-text price">
              ${marketData.low52w.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Next Earnings (Stocks) */}
        {source === 'stock' && earnings?.nextEarnings && (
          <div className="p-4 rounded-lg bg-tv-bg-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-tv-text-soft" />
              <p className="text-xs text-tv-text-soft font-medium">Next Earnings</p>
            </div>
            <p className="text-lg font-bold text-tv-text">{formatDate(earnings.nextEarnings)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
