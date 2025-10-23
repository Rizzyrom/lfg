'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData } from 'lightweight-charts'
import useSWR from 'swr'
import { PriceData } from '@/lib/marketDataAPI'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AssetChartProps {
  symbol: string
  source: 'crypto' | 'stock'
  className?: string
}

type TimeFrame = '24h' | '3d' | '7d' | '1M' | '6M' | '1Y' | '5Y' | 'All'

const timeFrameToDays: Record<TimeFrame, number> = {
  '24h': 1,
  '3d': 3,
  '7d': 7,
  '1M': 30,
  '6M': 180,
  '1Y': 365,
  '5Y': 1825,
  'All': 3650,
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function AssetChart({ symbol, source, className = '' }: AssetChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7d')
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)

  // Fetch chart data with SWR
  const { data: chartData, error, isLoading } = useSWR<PriceData[]>(
    `/api/chart?symbol=${symbol}&source=${source}&days=${timeFrameToDays[timeFrame]}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes (much less aggressive)
      revalidateOnFocus: false, // Don't refetch on tab focus
      dedupingInterval: 60000, // Dedupe requests within 1 minute
    }
  )

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#000000',
      },
      grid: {
        vertLines: { color: 'rgba(0, 0, 0, 0.04)' },
        horzLines: { color: 'rgba(0, 0, 0, 0.04)' },
      },
      crosshair: {
        vertLine: {
          color: '#475569',
          width: 1,
          style: 3,
          labelBackgroundColor: '#475569',
        },
        horzLine: {
          color: '#475569',
          width: 1,
          style: 3,
          labelBackgroundColor: '#475569',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 0, 0, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: 'rgba(0, 0, 0, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    })

    candleSeriesRef.current = candleSeries

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#475569',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    // Set scale margins for volume series
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    volumeSeriesRef.current = volumeSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!chartData || !candleSeriesRef.current || !volumeSeriesRef.current) return

    // Format data for chart
    const candleData: CandlestickData[] = chartData.map((d) => ({
      time: Math.floor(d.timestamp / 1000) as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    const volumeData: HistogramData[] = chartData.map((d, index) => {
      const prevClose = index > 0 ? chartData[index - 1].close : d.open
      const color = d.close >= prevClose ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'

      return {
        time: Math.floor(d.timestamp / 1000) as any,
        value: d.volume,
        color,
      }
    })

    // Update series
    candleSeriesRef.current.setData(candleData)
    volumeSeriesRef.current.setData(volumeData)

    // Calculate current price and change
    if (chartData.length > 0) {
      const latest = chartData[chartData.length - 1]
      const earliest = chartData[0]
      setCurrentPrice(latest.close)
      setPriceChange(((latest.close - earliest.close) / earliest.close) * 100)
    }

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [chartData])

  const timeFrames: TimeFrame[] = ['24h', '3d', '7d', '1M', '6M', '1Y', '5Y', 'All']

  return (
    <div className={`card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-tv-text mb-1">Price Chart</h2>
          {currentPrice !== null && (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-tv-text font-mono price">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {priceChange !== null && (
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    priceChange >= 0 ? 'text-tv-up' : 'text-tv-down'
                  }`}
                >
                  {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {priceChange >= 0 ? '+' : ''}
                    {priceChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-tv-bg-secondary rounded-lg p-1">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeFrame === tf
                  ? 'bg-white text-tv-text shadow-elevation-1'
                  : 'text-tv-text-soft hover:text-tv-text'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-tv-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-tv-text-soft font-medium">Loading chart data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="text-center">
              <TrendingDown className="w-12 h-12 text-tv-down mx-auto mb-3" />
              <p className="text-sm text-tv-text-soft font-medium">Failed to load chart data</p>
              <p className="text-xs text-tv-text-muted mt-1">Please try again later</p>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-tv-text-soft">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-tv-up rounded" />
            <span>Up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-tv-down rounded" />
            <span>Down</span>
          </div>
        </div>
        <div>
          <span className="font-medium">Updates every 30s</span>
        </div>
      </div>
    </div>
  )
}
