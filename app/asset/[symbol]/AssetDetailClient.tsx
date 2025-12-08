'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, Share2, Bell } from 'lucide-react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MarketData } from '@/lib/marketDataAPI'

// Lazy load heavy components for better performance
const AssetChart = dynamic(() => import('@/components/AssetChart'), {
  loading: () => <div className="card p-6 h-[450px] animate-pulse bg-tv-bg-secondary" />,
  ssr: false,
})
const MarketDataPanel = dynamic(() => import('@/components/MarketDataPanel'), {
  loading: () => <div className="card p-6 h-[200px] animate-pulse bg-tv-bg-secondary" />,
})
const TechnicalIndicators = dynamic(() => import('@/components/TechnicalIndicators'), {
  loading: () => <div className="card p-6 h-[400px] animate-pulse bg-tv-bg-secondary" />,
})
const SentimentPanel = dynamic(() => import('@/components/SentimentPanel'), {
  loading: () => <div className="card p-6 h-[300px] animate-pulse bg-tv-bg-secondary" />,
})
const AssetNews = dynamic(() => import('@/components/AssetNews'), {
  loading: () => <div className="card p-6 h-[600px] animate-pulse bg-tv-bg-secondary" />,
})

interface AssetDetailClientProps {
  symbol: string
  source: 'crypto' | 'stock'
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function AssetDetailClient({ symbol, source }: AssetDetailClientProps) {
  const router = useRouter()

  // Fetch live price data for hero section
  const { data: marketData } = useSWR<MarketData>(
    `/api/market-data?symbol=${symbol}&source=${source}`,
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds for real-time feel
      revalidateOnFocus: true,
    }
  )

  const priceChange = marketData?.change24h ?? 0
  const isPositive = priceChange >= 0

  return (
    <ErrorBoundary>
      <div className="w-full pb-24">
        {/* Robinhood-style Header with prominent price */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-tv-border">
          {/* Top bar with back button and actions */}
          <div className="px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-tv-text-soft hover:text-tv-text active:scale-95 transition-all p-2 -ml-2 touch-manipulation rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1">
              <button className="p-2.5 rounded-full hover:bg-tv-chip active:scale-95 transition-all touch-manipulation" title="Add to watchlist">
                <Star className="w-5 h-5 text-tv-text-soft" />
              </button>
              <button className="p-2.5 rounded-full hover:bg-tv-chip active:scale-95 transition-all touch-manipulation" title="Set alert">
                <Bell className="w-5 h-5 text-tv-text-soft" />
              </button>
              <button className="p-2.5 rounded-full hover:bg-tv-chip active:scale-95 transition-all touch-manipulation" title="Share">
                <Share2 className="w-5 h-5 text-tv-text-soft" />
              </button>
            </div>
          </div>

          {/* Symbol and Price Hero */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-tv-text">{symbol}</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-tv-chip text-tv-text-soft uppercase tracking-wide">
                {source}
              </span>
            </div>

            {/* Big Price Display - Robinhood style */}
            {marketData ? (
              <div className="animate-fade-in">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-4xl sm:text-5xl font-bold text-tv-text font-mono tracking-tight">
                    ${marketData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={`flex items-center gap-2 ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
                  <span className="text-lg font-bold">
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                  <span className="text-sm text-tv-text-soft font-medium">Today</span>
                  {marketData.priceChange7d !== undefined && (
                    <>
                      <span className="text-tv-text-muted">•</span>
                      <span className={`text-sm font-semibold ${marketData.priceChange7d >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                        {marketData.priceChange7d >= 0 ? '+' : ''}{marketData.priceChange7d.toFixed(2)}% 7d
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-12 bg-tv-chip rounded-lg w-48 mb-2" />
                <div className="h-6 bg-tv-chip rounded w-32" />
              </div>
            )}
          </div>
        </div>

        {/* Content sections with smooth animations */}
        <div className="w-full px-3 sm:px-4 pt-4 space-y-4">
          {/* Chart - Full width */}
          <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <AssetChart symbol={symbol} source={source} />
          </div>

          {/* Market Data Stats */}
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <MarketDataPanel symbol={symbol} source={source} />
          </div>

          {/* Technical Indicators */}
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <TechnicalIndicators symbol={symbol} source={source} />
          </div>

          {/* Sentiment */}
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <SentimentPanel symbol={symbol} source={source} />
          </div>

          {/* News */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <AssetNews symbol={symbol} source={source} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
