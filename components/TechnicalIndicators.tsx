'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { TechnicalIndicators as TechnicalIndicatorsType } from '@/lib/marketDataAPI'
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface TechnicalIndicatorsProps {
  symbol: string
  source: 'crypto' | 'stock'
  className?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function TechnicalIndicators({ symbol, source, className = '' }: TechnicalIndicatorsProps) {
  const { data: indicators, error, isLoading } = useSWR<TechnicalIndicatorsType>(
    `/api/technical-indicators?symbol=${symbol}&source=${source}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  )

  const [bullishCount, setBullishCount] = useState(0)
  const [bearishCount, setBearishCount] = useState(0)

  useEffect(() => {
    if (!indicators) return

    let bullish = 0
    let bearish = 0

    // RSI Analysis
    if (indicators.rsi < 30) bullish++
    if (indicators.rsi > 70) bearish++

    // MACD Analysis
    if (indicators.macd.histogram > 0) bullish++
    else bearish++

    // Moving Average Analysis
    const currentPrice = indicators.movingAverages.ma20 // Assuming latest close
    if (currentPrice > indicators.movingAverages.ma50) bullish++
    else bearish++

    if (currentPrice > indicators.movingAverages.ma200) bullish++
    else bearish++

    // Bollinger Bands Analysis
    const bbPosition = (currentPrice - indicators.bollingerBands.lower) /
                      (indicators.bollingerBands.upper - indicators.bollingerBands.lower)
    if (bbPosition < 0.2) bullish++
    if (bbPosition > 0.8) bearish++

    setBullishCount(bullish)
    setBearishCount(bearish)
  }, [indicators])

  if (isLoading) {
    return (
      <div className={`card p-6 ${className}`}>
        <h2 className="text-lg font-bold text-tv-text mb-4">Technical Indicators</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-tv-chip rounded w-24 mb-2" />
              <div className="h-8 bg-tv-chip rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !indicators) {
    return (
      <div className={`card p-6 ${className}`}>
        <h2 className="text-lg font-bold text-tv-text mb-4">Technical Indicators</h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-tv-text-soft mx-auto mb-3 opacity-50" />
          <p className="text-sm text-tv-text-soft">Not enough data for technical analysis</p>
          <p className="text-xs text-tv-text-muted mt-1">Requires at least 200 data points</p>
        </div>
      </div>
    )
  }

  const getRSIStatus = (rsi: number) => {
    if (rsi < 30) return { label: 'Oversold', color: 'text-tv-up', bg: 'bg-tv-up/10' }
    if (rsi > 70) return { label: 'Overbought', color: 'text-tv-down', bg: 'bg-tv-down/10' }
    return { label: 'Neutral', color: 'text-tv-text-soft', bg: 'bg-tv-chip' }
  }

  const getMACDStatus = (histogram: number) => {
    if (histogram > 0) return { label: 'Bullish', color: 'text-tv-up', icon: TrendingUp }
    return { label: 'Bearish', color: 'text-tv-down', icon: TrendingDown }
  }

  const rsiStatus = getRSIStatus(indicators.rsi)
  const macdStatus = getMACDStatus(indicators.macd.histogram)

  const totalSignals = bullishCount + bearishCount
  const bullishPercentage = totalSignals > 0 ? (bullishCount / totalSignals) * 100 : 50

  return (
    <div className={`card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-tv-blue" />
        <h2 className="text-lg font-bold text-tv-text">Technical Indicators</h2>
      </div>

      {/* Signal Summary */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-tv-bg-secondary to-tv-chip">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-tv-up rounded-full" />
            <span className="text-sm font-semibold text-tv-text">Bullish Signals</span>
            <span className="text-lg font-bold text-tv-up">{bullishCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-tv-down">{bearishCount}</span>
            <span className="text-sm font-semibold text-tv-text">Bearish Signals</span>
            <div className="w-3 h-3 bg-tv-down rounded-full" />
          </div>
        </div>

        {/* Signal Bar */}
        <div className="relative h-2 bg-tv-down/20 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-tv-up transition-all duration-500"
            style={{ width: `${bullishPercentage}%` }}
          />
        </div>

        <p className="text-xs text-tv-text-soft text-center mt-2">
          {bullishPercentage > 60 ? 'Strong Bullish Momentum' :
           bullishPercentage < 40 ? 'Strong Bearish Momentum' :
           'Neutral Market Conditions'}
        </p>
      </div>

      {/* Indicators Grid */}
      <div className="space-y-4">
        {/* RSI */}
        <div className="p-4 rounded-lg border border-tv-border hover:border-tv-blue/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-tv-text">RSI (14)</p>
              <p className="text-xs text-tv-text-soft">Relative Strength Index</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${rsiStatus.bg} ${rsiStatus.color}`}>
              {rsiStatus.label}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold text-tv-text price">{indicators.rsi.toFixed(2)}</span>
            <div className="flex-1 mb-1">
              <div className="relative h-2 bg-tv-chip rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                    indicators.rsi < 30 ? 'bg-tv-up' : indicators.rsi > 70 ? 'bg-tv-down' : 'bg-tv-blue'
                  }`}
                  style={{ width: `${Math.min(indicators.rsi, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-tv-text-muted mt-1">
                <span>0</span>
                <span>30</span>
                <span>70</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        {/* MACD */}
        <div className="p-4 rounded-lg border border-tv-border hover:border-tv-blue/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-tv-text">MACD</p>
              <p className="text-xs text-tv-text-soft">Moving Average Convergence Divergence</p>
            </div>
            <div className={`flex items-center gap-1 ${macdStatus.color}`}>
              <macdStatus.icon className="w-4 h-4" />
              <span className="text-xs font-semibold">{macdStatus.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-tv-text-soft mb-1">MACD</p>
              <p className="text-sm font-bold text-tv-text price">{indicators.macd.value.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-tv-text-soft mb-1">Signal</p>
              <p className="text-sm font-bold text-tv-text price">{indicators.macd.signal.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-tv-text-soft mb-1">Histogram</p>
              <p className={`text-sm font-bold price ${indicators.macd.histogram > 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                {indicators.macd.histogram.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="p-4 rounded-lg border border-tv-border hover:border-tv-blue/30 transition-colors">
          <div className="mb-3">
            <p className="text-sm font-semibold text-tv-text">Moving Averages</p>
            <p className="text-xs text-tv-text-soft">Simple Moving Averages</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-tv-text-soft mb-1">MA 20</p>
              <p className="text-sm font-bold text-tv-text price">
                ${indicators.movingAverages.ma20.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-tv-text-soft mb-1">MA 50</p>
              <p className="text-sm font-bold text-tv-text price">
                ${indicators.movingAverages.ma50.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-tv-text-soft mb-1">MA 200</p>
              <p className="text-sm font-bold text-tv-text price">
                ${indicators.movingAverages.ma200.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="p-4 rounded-lg border border-tv-border hover:border-tv-blue/30 transition-colors">
          <div className="mb-3">
            <p className="text-sm font-semibold text-tv-text">Bollinger Bands</p>
            <p className="text-xs text-tv-text-soft">20-period, 2 standard deviations</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-tv-text-soft mb-1">Upper</p>
              <p className="text-sm font-bold text-tv-text price">
                ${indicators.bollingerBands.upper.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-tv-text-soft mb-1">Middle</p>
              <p className="text-sm font-bold text-tv-text price">
                ${indicators.bollingerBands.middle.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-tv-text-soft mb-1">Lower</p>
              <p className="text-sm font-bold text-tv-text price">
                ${indicators.bollingerBands.lower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        {indicators.support && indicators.resistance && (
          <div className="p-4 rounded-lg border border-tv-border hover:border-tv-blue/30 transition-colors">
            <div className="mb-3">
              <p className="text-sm font-semibold text-tv-text">Support & Resistance</p>
              <p className="text-xs text-tv-text-soft">Based on recent 30-day highs and lows</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-tv-text-soft mb-1">Support</p>
                <p className="text-sm font-bold text-tv-up price">
                  ${indicators.support.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-tv-text-soft mb-1">Resistance</p>
                <p className="text-sm font-bold text-tv-down price">
                  ${indicators.resistance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Info */}
      <div className="mt-4 pt-4 border-t border-tv-border">
        <p className="text-xs text-tv-text-soft text-center">
          Updates every 60 seconds • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
