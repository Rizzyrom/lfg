'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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

export default function AssetDetailClient({ symbol, source }: AssetDetailClientProps) {
  const router = useRouter()

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-tv-text-soft hover:text-tv-text transition-all mb-4 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Watchlist</span>
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-tv-text">{symbol}</h1>
          <span className="px-3 py-1 rounded-full bg-tv-chip text-tv-text-soft text-sm font-medium uppercase">
            {source}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart and Market Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Chart */}
          <AssetChart symbol={symbol} source={source} />

          {/* Market Data Panel */}
          <MarketDataPanel symbol={symbol} source={source} />

          {/* News Feed */}
          <AssetNews symbol={symbol} source={source} />
        </div>

        {/* Right Column - Indicators and Sentiment */}
        <div className="lg:col-span-1 space-y-6">
          {/* Technical Indicators */}
          <TechnicalIndicators symbol={symbol} source={source} />

          {/* Sentiment/Analyst Ratings */}
          <SentimentPanel symbol={symbol} source={source} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 flex gap-2 z-10">
        <Link
          href="/watchlist"
          className="px-6 py-3 rounded-full bg-tv-blue hover:bg-tv-blue-hover text-white font-medium shadow-elevation-3 transition-all active:scale-95 touch-manipulation"
        >
          Back to Watchlist
        </Link>
      </div>
    </div>
    </ErrorBoundary>
  )
}
