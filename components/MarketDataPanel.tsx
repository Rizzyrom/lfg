'use client'

import useSWR from 'swr'
import { MarketData } from '@/lib/marketDataAPI'
import { TrendingUp, TrendingDown, DollarSign, Activity, Layers, Calendar, BarChart3, Percent, ArrowUpDown, Clock } from 'lucide-react'

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
      refreshInterval: 30000, // Refresh every 30 seconds for real-time feel
      revalidateOnFocus: true,
      dedupingInterval: 10000,
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

  // Helper to render a metric card
  const MetricCard = ({ icon: Icon, label, value, subValue, colorClass }: {
    icon: any,
    label: string,
    value: string | number,
    subValue?: string,
    colorClass?: string
  }) => (
    <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-tv-grid/20 hover:border-tv-blue/30 transition-all">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-tv-text-muted" />
        <p className="text-[11px] text-tv-text-soft font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-base font-bold ${colorClass || 'text-tv-text'}`}>{value}</p>
      {subValue && <p className="text-[10px] text-tv-text-muted mt-0.5">{subValue}</p>}
    </div>
  )

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-tv-blue" />
        <h2 className="text-lg font-bold text-tv-text">Market Stats</h2>
        <span className="ml-auto text-[10px] text-tv-text-muted bg-tv-chip px-2 py-0.5 rounded-full">Live</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* Current Price - Always first */}
        <MetricCard
          icon={DollarSign}
          label="Price"
          value={`$${marketData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />

        {/* 24h Change */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-tv-grid/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-tv-text-muted" />
            <p className="text-[11px] text-tv-text-soft font-medium uppercase tracking-wide">24h Change</p>
          </div>
          <div className={`flex items-center gap-1 text-base font-bold ${marketData.change24h >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
            {marketData.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%</span>
          </div>
        </div>

        {/* Day Range */}
        {(marketData.high24h || marketData.low24h) && (
          <MetricCard
            icon={ArrowUpDown}
            label="Day Range"
            value={`$${(marketData.low24h || 0).toFixed(2)} - $${(marketData.high24h || 0).toFixed(2)}`}
          />
        )}

        {/* 52-Week Range */}
        {marketData.high52w && marketData.low52w && (
          <MetricCard
            icon={BarChart3}
            label="52-Week Range"
            value={`$${marketData.low52w.toFixed(2)} - $${marketData.high52w.toFixed(2)}`}
          />
        )}

        {/* Market Cap */}
        {marketData.marketCap && (
          <MetricCard
            icon={Layers}
            label="Market Cap"
            value={formatLargeNumber(marketData.marketCap)}
          />
        )}

        {/* Volume */}
        {marketData.volume24h && (
          <MetricCard
            icon={BarChart3}
            label="Volume (24h)"
            value={formatLargeNumber(marketData.volume24h)}
            subValue={marketData.avgVolume ? `Avg: ${formatNumber(marketData.avgVolume)}` : undefined}
          />
        )}

        {/* Stock-specific metrics */}
        {source === 'stock' && (
          <>
            {/* P/E Ratio */}
            {marketData.peRatio && (
              <MetricCard
                icon={Percent}
                label="P/E Ratio"
                value={marketData.peRatio.toFixed(2)}
              />
            )}

            {/* EPS */}
            {marketData.eps && (
              <MetricCard
                icon={DollarSign}
                label="EPS (TTM)"
                value={`$${marketData.eps.toFixed(2)}`}
              />
            )}

            {/* Beta */}
            {marketData.beta && (
              <MetricCard
                icon={Activity}
                label="Beta"
                value={marketData.beta.toFixed(2)}
              />
            )}

            {/* Dividend Yield */}
            {marketData.dividendYield !== undefined && marketData.dividendYield > 0 && (
              <MetricCard
                icon={Percent}
                label="Dividend Yield"
                value={`${marketData.dividendYield.toFixed(2)}%`}
              />
            )}

            {/* Previous Close */}
            {marketData.previousClose && (
              <MetricCard
                icon={Clock}
                label="Prev Close"
                value={`$${marketData.previousClose.toFixed(2)}`}
              />
            )}

            {/* Open */}
            {marketData.openPrice && (
              <MetricCard
                icon={Clock}
                label="Open"
                value={`$${marketData.openPrice.toFixed(2)}`}
              />
            )}

            {/* Bid/Ask */}
            {marketData.bid && marketData.ask && (
              <MetricCard
                icon={ArrowUpDown}
                label="Bid / Ask"
                value={`$${marketData.bid.toFixed(2)} / $${marketData.ask.toFixed(2)}`}
              />
            )}

            {/* Next Earnings */}
            {earnings?.nextEarnings && (
              <MetricCard
                icon={Calendar}
                label="Next Earnings"
                value={formatDate(earnings.nextEarnings)}
              />
            )}
          </>
        )}

        {/* Crypto-specific metrics */}
        {source === 'crypto' && (
          <>
            {/* Circulating Supply */}
            {marketData.circulatingSupply && (
              <MetricCard
                icon={Layers}
                label="Circulating Supply"
                value={formatNumber(marketData.circulatingSupply)}
                subValue={marketData.totalSupply ? `of ${formatNumber(marketData.totalSupply)} total` : undefined}
              />
            )}

            {/* All-Time High */}
            {marketData.ath && (
              <MetricCard
                icon={TrendingUp}
                label="All-Time High"
                value={`$${marketData.ath.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subValue={marketData.athDate ? formatDate(marketData.athDate) : undefined}
              />
            )}

            {/* All-Time Low */}
            {marketData.atl && (
              <MetricCard
                icon={TrendingDown}
                label="All-Time Low"
                value={`$${marketData.atl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subValue={marketData.atlDate ? formatDate(marketData.atlDate) : undefined}
              />
            )}

            {/* 7d Change */}
            {marketData.priceChange7d !== undefined && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-tv-grid/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-tv-text-muted" />
                  <p className="text-[11px] text-tv-text-soft font-medium uppercase tracking-wide">7d Change</p>
                </div>
                <p className={`text-base font-bold ${marketData.priceChange7d >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                  {marketData.priceChange7d >= 0 ? '+' : ''}{marketData.priceChange7d.toFixed(2)}%
                </p>
              </div>
            )}

            {/* 30d Change */}
            {marketData.priceChange30d !== undefined && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-tv-grid/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-tv-text-muted" />
                  <p className="text-[11px] text-tv-text-soft font-medium uppercase tracking-wide">30d Change</p>
                </div>
                <p className={`text-base font-bold ${marketData.priceChange30d >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                  {marketData.priceChange30d >= 0 ? '+' : ''}{marketData.priceChange30d.toFixed(2)}%
                </p>
              </div>
            )}

            {/* 1y Change */}
            {marketData.priceChange1y !== undefined && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-tv-grid/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-tv-text-muted" />
                  <p className="text-[11px] text-tv-text-soft font-medium uppercase tracking-wide">1y Change</p>
                </div>
                <p className={`text-base font-bold ${marketData.priceChange1y >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                  {marketData.priceChange1y >= 0 ? '+' : ''}{marketData.priceChange1y.toFixed(2)}%
                </p>
              </div>
            )}

            {/* Fully Diluted Valuation */}
            {marketData.fullyDilutedValuation && (
              <MetricCard
                icon={Layers}
                label="Fully Diluted Val"
                value={formatLargeNumber(marketData.fullyDilutedValuation)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
