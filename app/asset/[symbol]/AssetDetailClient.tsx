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
      <div className="w-full min-h-screen pb-24">
        {/* Mobile-optimized Header */}
        <div className="sticky top-0 z-20 bg-tv-bg/95 backdrop-blur-lg border-b border-tv-border px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-tv-text-soft active:text-tv-text transition-colors mb-2 -ml-2 p-2 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-tv-text truncate">{symbol}</h1>
            <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-tv-chip text-tv-text-soft uppercase">
              {source}
            </span>
          </div>
        </div>

        {/* Mobile-first single column layout */}
        <div className="w-full px-3 sm:px-4 pt-4 space-y-4">
          {/* Chart - Full width mobile */}
          <AssetChart symbol={symbol} source={source} />

          {/* Market Data */}
          <MarketDataPanel symbol={symbol} source={source} />

          {/* Technical Indicators */}
          <TechnicalIndicators symbol={symbol} source={source} />

          {/* Sentiment */}
          <SentimentPanel symbol={symbol} source={source} />

          {/* News */}
          <AssetNews symbol={symbol} source={source} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
