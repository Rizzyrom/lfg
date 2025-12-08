'use client'

import { useState, useEffect } from 'react'

interface WatchItem {
  id: string
  symbol: string
  source: string
  tags: string[]
}

interface Price {
  symbol: string
  source: string
  price: string
  change24h: string | null
}

interface WatchlistRailProps {
  onItemClick?: (symbol: string, source: string) => void
}

export default function WatchlistRail({ onItemClick }: WatchlistRailProps = {}) {
  const [items, setItems] = useState<WatchItem[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<{ item: WatchItem; price: Price } | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/watchlist/prices')

      if (res.ok) {
        const data = await res.json()
        const itemsWithPrices = data.items || []

        // Split into items and prices for component state
        setItems(itemsWithPrices)
        setPrices(itemsWithPrices.map((item: any) => ({
          symbol: item.symbol,
          source: item.source,
          price: item.price,
          change24h: item.change24h
        })))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (symbol: string, source: string) => {
    return prices.find(p => p.symbol === symbol && p.source === source)
  }

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold text-tv-text mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-tv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Watchlist
      </h2>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-tv-grid rounded animate-pulse"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-tv-text-soft mb-2">No items yet</p>
          <p className="text-xs text-tv-text-soft">Add symbols in Watchlist tab</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const priceData = getPrice(item.symbol, item.source)
            const change = priceData?.change24h ? parseFloat(priceData.change24h) : 0
            const isPositive = change >= 0
            const staggerClass = index < 8 ? 'animate-stagger-in' : ''
            const staggerDelay = index < 8 ? `${index * 50}ms` : '0ms'

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (priceData) {
                    setSelectedItem({ item, price: priceData })
                    onItemClick?.(item.symbol, item.source)
                  }
                }}
                className={`p-3 bg-tv-chip rounded-lg hover:bg-tv-hover transition-all duration-200 cursor-pointer border border-transparent hover:border-tv-blue active:scale-[0.98] ${staggerClass}`}
                style={{ animationDelay: staggerDelay }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-tv-text">{item.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-tv-grid text-tv-text-soft uppercase">
                      {item.source}
                    </span>
                  </div>
                  {priceData && (
                    <span className={`text-xs font-semibold ${isPositive ? 'text-tv-up' : 'text-tv-down'}`}>
                      {isPositive ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  )}
                </div>
                {priceData && (
                  <div className="text-sm font-mono price text-tv-text">
                    ${parseFloat(priceData.price).toLocaleString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Price Detail Overlay */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-tv-panel rounded-2xl shadow-2xl max-w-md w-full p-6 border border-tv-grid animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-tv-blue/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-tv-blue">
                    {selectedItem.item.symbol.substring(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tv-text">{selectedItem.item.symbol}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-tv-chip text-tv-text-soft uppercase">
                    {selectedItem.item.source}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-10 h-10 rounded-full bg-tv-chip hover:bg-tv-hover flex items-center justify-center transition"
              >
                <svg className="w-5 h-5 text-tv-text-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-tv-text-soft mb-2">Current Price</p>
                <p className="text-4xl font-bold text-tv-text font-mono">
                  ${parseFloat(selectedItem.price.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-tv-chip rounded-lg">
                  <p className="text-xs text-tv-text-soft mb-1">24h Change</p>
                  <p className={`text-xl font-bold ${parseFloat(selectedItem.price.change24h || '0') >= 0 ? 'text-tv-up' : 'text-tv-down'}`}>
                    {parseFloat(selectedItem.price.change24h || '0') >= 0 ? '+' : ''}
                    {parseFloat(selectedItem.price.change24h || '0').toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 bg-tv-chip rounded-lg">
                  <p className="text-xs text-tv-text-soft mb-1">Market</p>
                  <p className="text-xl font-bold text-tv-text capitalize">{selectedItem.item.source}</p>
                </div>
              </div>

              {selectedItem.item.tags.length > 0 && (
                <div>
                  <p className="text-xs text-tv-text-soft mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.item.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 text-xs rounded bg-tv-blue/20 text-tv-blue">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  try {
                    const message = `📊 ${selectedItem.item.symbol} (${selectedItem.item.source})\nPrice: $${parseFloat(selectedItem.price.price).toLocaleString()}\n24h: ${parseFloat(selectedItem.price.change24h || '0') >= 0 ? '+' : ''}${parseFloat(selectedItem.price.change24h || '0').toFixed(2)}%`
                    const res = await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message }),
                    })
                    if (res.ok) {
                      alert('Shared to chat!')
                      setSelectedItem(null)
                    }
                  } catch (error) {
                    console.error('Failed to share:', error)
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-tv-blue text-white font-medium hover:bg-tv-blue/90 transition-all shadow-lg shadow-tv-blue/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Share to Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
