'use client'

import { useState } from 'react'
import SocialFeed from './SocialFeed'

interface AssetData {
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap?: number
  volume24h?: number
  rank?: number
  pe?: number
  eps?: number
  nextEarnings?: string
  description?: string
  links?: {
    website?: string
    twitter?: string
    reddit?: string
  }
  logo?: string
  weburl?: string
}

interface NewsItem {
  headline: string
  url: string
  datetime: number
  image?: string
}

interface RightRailProps {
  selectedAsset?: { symbol: string; source: string }
}

export default function RightRail({ selectedAsset }: RightRailProps = {}) {
  const [loading, setLoading] = useState(false)
  const [assetData, setAssetData] = useState<AssetData | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [aiSummary, setAiSummary] = useState('')

  const handlePulse = async (symbol?: string, source?: string) => {
    if (!symbol || !source) return

    setLoading(true)
    setAssetData(null)
    setNews([])
    setAiSummary('')

    try {
      const res = await fetch('/api/pulse/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, source }),
      })

      if (res.ok) {
        const data = await res.json()
        setAssetData(data.asset)
        setNews(data.news || [])
        setAiSummary(data.aiSummary || '')
      }
    } catch (error) {
      console.error('Pulse failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-trigger when selectedAsset changes
  if (selectedAsset && !loading && (!assetData || assetData.symbol !== selectedAsset.symbol)) {
    handlePulse(selectedAsset.symbol, selectedAsset.source)
  }

  return (
    <div className="space-y-4">
      {/* Social Feed */}
      <SocialFeed />

      {/* AI Pulse */}
      <div className="card p-4">
        <h2 className="text-lg font-bold text-tv-text mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-tv-blue" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
          AI Pulse
        </h2>

        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-tv-chip rounded animate-pulse" />
            <div className="h-4 bg-tv-chip rounded animate-pulse w-3/4" />
            <div className="h-4 bg-tv-chip rounded animate-pulse w-1/2" />
          </div>
        ) : assetData ? (
          <div className="space-y-4">
            {/* Asset Header */}
            <div className="flex items-start gap-3">
              {assetData.logo && (
                <img src={assetData.logo} alt={assetData.name} className="w-12 h-12 rounded-full" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-tv-text">{assetData.name}</h3>
                <p className="text-sm text-tv-text-soft">{assetData.symbol}</p>
              </div>
            </div>

            {/* Price Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-tv-text-soft mb-1">Price</p>
                <p className="text-lg font-bold text-tv-text font-mono">
                  ${assetData.price?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-tv-text-soft mb-1">24h Change</p>
                <p className={`text-lg font-bold ${assetData.change24h >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                  {assetData.change24h >= 0 ? '+' : ''}{assetData.change24h?.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Market Data */}
            {assetData.marketCap && (
              <div>
                <p className="text-xs text-tv-text-soft mb-1">Market Cap</p>
                <p className="text-sm font-semibold text-tv-text">
                  ${(assetData.marketCap / 1e9).toFixed(2)}B
                  {assetData.rank && ` • Rank #${assetData.rank}`}
                </p>
              </div>
            )}

            {assetData.volume24h && (
              <div>
                <p className="text-xs text-tv-text-soft mb-1">24h Volume</p>
                <p className="text-sm font-semibold text-tv-text">
                  ${(assetData.volume24h / 1e9).toFixed(2)}B
                </p>
              </div>
            )}

            {/* Stock-specific data */}
            {assetData.pe && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-tv-text-soft mb-1">P/E Ratio</p>
                  <p className="text-sm font-semibold text-tv-text">{assetData.pe.toFixed(2)}</p>
                </div>
                {assetData.eps && (
                  <div>
                    <p className="text-xs text-tv-text-soft mb-1">EPS</p>
                    <p className="text-sm font-semibold text-tv-text">${assetData.eps.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            {assetData.nextEarnings && (
              <div>
                <p className="text-xs text-tv-text-soft mb-1">Next Earnings</p>
                <p className="text-sm font-semibold text-tv-text">{assetData.nextEarnings}</p>
              </div>
            )}

            {/* AI Summary */}
            {aiSummary && (
              <div className="p-3 bg-tv-blue/10 rounded-lg border border-tv-blue/20">
                <p className="text-sm text-tv-text leading-relaxed">{aiSummary}</p>
              </div>
            )}

            {/* Links */}
            {assetData.links && (
              <div className="flex gap-2 flex-wrap">
                {assetData.links.website && (
                  <a
                    href={assetData.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs font-medium rounded bg-tv-chip hover:bg-tv-hover text-tv-text transition"
                  >
                    Website
                  </a>
                )}
                {assetData.links.twitter && (
                  <a
                    href={assetData.links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs font-medium rounded bg-tv-chip hover:bg-tv-hover text-tv-text transition"
                  >
                    Twitter
                  </a>
                )}
                {assetData.weburl && (
                  <a
                    href={assetData.weburl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs font-medium rounded bg-tv-chip hover:bg-tv-hover text-tv-text transition"
                  >
                    Company
                  </a>
                )}
              </div>
            )}

            {/* Recent News */}
            {news.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-tv-text mb-2">Recent News</p>
                <div className="space-y-2">
                  {news.slice(0, 3).map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-tv-chip hover:bg-tv-hover rounded text-xs text-tv-text hover:text-tv-blue transition"
                    >
                      {item.headline}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-tv-text-soft italic">
            Click on any asset in your watchlist to see detailed AI analysis
          </p>
        )}
      </div>
    </div>
  )
}
