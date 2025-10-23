'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Brain, ThumbsUp, ThumbsDown, Minus, TrendingUp } from 'lucide-react'

interface SentimentPanelProps {
  symbol: string
  source: 'crypto' | 'stock'
  className?: string
}

interface FearGreedData {
  value: number
  classification: string
  timestamp: number
}

interface AnalystRatings {
  buy: number
  hold: number
  sell: number
  period: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function SentimentPanel({ symbol, source, className = '' }: SentimentPanelProps) {
  // Fear & Greed Index (crypto only)
  const { data: fearGreed } = useSWR<FearGreedData>(
    source === 'crypto' ? '/api/fear-greed' : null,
    fetcher,
    {
      refreshInterval: 3600000, // Refresh hourly
    }
  )

  // Analyst Ratings (stocks only)
  const { data: ratings } = useSWR<AnalystRatings>(
    source === 'stock' ? `/api/analyst-ratings?symbol=${symbol}` : null,
    fetcher,
    {
      refreshInterval: 86400000, // Refresh daily
    }
  )

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return 'text-tv-down'
    if (value <= 45) return 'text-orange-500'
    if (value <= 55) return 'text-tv-text-soft'
    if (value <= 75) return 'text-lime-500'
    return 'text-tv-up'
  }

  const getFearGreedBg = (value: number) => {
    if (value <= 25) return 'bg-tv-down/10'
    if (value <= 45) return 'bg-orange-500/10'
    if (value <= 55) return 'bg-tv-chip'
    if (value <= 75) return 'bg-lime-500/10'
    return 'bg-tv-up/10'
  }

  const getFearGreedLabel = (value: number) => {
    if (value <= 25) return 'Extreme Fear'
    if (value <= 45) return 'Fear'
    if (value <= 55) return 'Neutral'
    if (value <= 75) return 'Greed'
    return 'Extreme Greed'
  }

  const totalRatings = ratings ? ratings.buy + ratings.hold + ratings.sell : 0
  const buyPercentage = ratings && totalRatings > 0 ? (ratings.buy / totalRatings) * 100 : 0
  const holdPercentage = ratings && totalRatings > 0 ? (ratings.hold / totalRatings) * 100 : 0
  const sellPercentage = ratings && totalRatings > 0 ? (ratings.sell / totalRatings) * 100 : 0

  const getAnalystSentiment = () => {
    if (!ratings) return { label: 'No Data', color: 'text-tv-text-soft' }
    if (buyPercentage > 60) return { label: 'Strong Buy', color: 'text-tv-up' }
    if (buyPercentage > 40) return { label: 'Buy', color: 'text-tv-up' }
    if (holdPercentage > 50) return { label: 'Hold', color: 'text-tv-text-soft' }
    if (sellPercentage > 40) return { label: 'Sell', color: 'text-tv-down' }
    return { label: 'Mixed', color: 'text-tv-text-soft' }
  }

  const analystSentiment = getAnalystSentiment()

  // Don't render if no data available for either type
  if (source === 'crypto' && !fearGreed) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-tv-blue" />
          <h2 className="text-lg font-bold text-tv-text">Market Sentiment</h2>
        </div>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-tv-text-soft mx-auto mb-3 opacity-50" />
          <p className="text-sm text-tv-text-soft">Loading sentiment data...</p>
        </div>
      </div>
    )
  }

  if (source === 'stock' && !ratings) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-tv-blue" />
          <h2 className="text-lg font-bold text-tv-text">Analyst Ratings</h2>
        </div>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-tv-text-soft mx-auto mb-3 opacity-50" />
          <p className="text-sm text-tv-text-soft">No analyst ratings available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-tv-blue" />
        <h2 className="text-lg font-bold text-tv-text">
          {source === 'crypto' ? 'Market Sentiment' : 'Analyst Ratings'}
        </h2>
      </div>

      {/* Crypto: Fear & Greed Index */}
      {source === 'crypto' && fearGreed && (
        <div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-tv-bg-secondary to-tv-chip mb-4">
            <div className="text-center mb-4">
              <p className="text-sm text-tv-text-soft mb-2">Crypto Fear & Greed Index</p>
              <div className={`text-6xl font-bold mb-2 ${getFearGreedColor(fearGreed.value)}`}>
                {fearGreed.value}
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getFearGreedBg(fearGreed.value)} ${getFearGreedColor(fearGreed.value)}`}>
                {getFearGreedLabel(fearGreed.value)}
              </div>
            </div>

            {/* Visual Scale */}
            <div className="relative h-3 bg-gradient-to-r from-tv-down via-yellow-500 to-tv-up rounded-full overflow-hidden mb-2">
              <div
                className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-500"
                style={{ left: `${fearGreed.value}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-tv-text-soft">
              <span>Extreme Fear</span>
              <span>Neutral</span>
              <span>Extreme Greed</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-tv-border">
            <p className="text-xs text-tv-text-soft mb-2">What does this mean?</p>
            <p className="text-sm text-tv-text">
              {fearGreed.value <= 25 && 'Investors are too worried. This could be a buying opportunity.'}
              {fearGreed.value > 25 && fearGreed.value <= 45 && 'Market sentiment is cautious. Investors are fearful.'}
              {fearGreed.value > 45 && fearGreed.value <= 55 && 'Market sentiment is neutral. No strong emotional bias.'}
              {fearGreed.value > 55 && fearGreed.value <= 75 && 'Market sentiment is positive. Investors are greedy.'}
              {fearGreed.value > 75 && 'Investors are getting too greedy. Market may be overheated.'}
            </p>
          </div>

          <p className="text-xs text-tv-text-muted text-center mt-4">
            Source: Alternative.me • Updated: {new Date(fearGreed.timestamp * 1000).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Stock: Analyst Ratings */}
      {source === 'stock' && ratings && (
        <div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-tv-bg-secondary to-tv-chip mb-4">
            <div className="text-center mb-4">
              <p className="text-sm text-tv-text-soft mb-2">Consensus Rating</p>
              <div className={`text-3xl font-bold mb-2 ${analystSentiment.color}`}>
                {analystSentiment.label}
              </div>
              <p className="text-xs text-tv-text-muted">
                Based on {totalRatings} analyst{totalRatings !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              {/* Buy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-tv-up" />
                    <span className="text-sm font-semibold text-tv-text">Buy</span>
                  </div>
                  <span className="text-sm font-bold text-tv-up">
                    {ratings.buy} ({buyPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="relative h-2 bg-tv-chip rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-tv-up transition-all duration-500"
                    style={{ width: `${buyPercentage}%` }}
                  />
                </div>
              </div>

              {/* Hold */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-tv-text-soft" />
                    <span className="text-sm font-semibold text-tv-text">Hold</span>
                  </div>
                  <span className="text-sm font-bold text-tv-text-soft">
                    {ratings.hold} ({holdPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="relative h-2 bg-tv-chip rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-tv-text-soft transition-all duration-500"
                    style={{ width: `${holdPercentage}%` }}
                  />
                </div>
              </div>

              {/* Sell */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-tv-down" />
                    <span className="text-sm font-semibold text-tv-text">Sell</span>
                  </div>
                  <span className="text-sm font-bold text-tv-down">
                    {ratings.sell} ({sellPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="relative h-2 bg-tv-chip rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-tv-down transition-all duration-500"
                    style={{ width: `${sellPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-tv-border">
            <p className="text-xs text-tv-text-soft mb-2">Interpretation</p>
            <p className="text-sm text-tv-text">
              {buyPercentage > 60 && 'Strong bullish consensus among analysts. High conviction in upside potential.'}
              {buyPercentage > 40 && buyPercentage <= 60 && 'Positive outlook with majority recommending buy.'}
              {holdPercentage > 50 && 'Analysts suggest holding current positions. Mixed outlook on near-term movement.'}
              {sellPercentage > 40 && 'Bearish consensus. Analysts recommend reducing or exiting positions.'}
            </p>
          </div>

          <p className="text-xs text-tv-text-muted text-center mt-4">
            Period: {ratings.period} • Updates daily
          </p>
        </div>
      )}
    </div>
  )
}
