'use client'

interface FeedCardProps {
  symbol: string
  source: string
  price: string
  change24h: string | null
  updatedAt: string
}

export default function FeedCard({ symbol, source, price, change24h, updatedAt }: FeedCardProps) {
  const change = change24h ? parseFloat(change24h) : 0
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-tv-up' : 'text-tv-down'

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-tv-text">{symbol}</h3>
            <span className="text-xs text-tv-text-soft uppercase">{source}</span>
          </div>
          <p className="text-2xl font-mono price text-tv-text mt-1">${price}</p>
        </div>
        {change24h && (
          <div className={`text-right ${changeColor}`}>
            <p className="text-lg font-semibold">
              {isPositive ? '+' : ''}
              {change.toFixed(2)}%
            </p>
            <p className="text-xs text-tv-text-soft">24h</p>
          </div>
        )}
      </div>
      <div className="mt-3 text-xs text-tv-text-soft">
        Updated {new Date(updatedAt).toLocaleTimeString()}
      </div>
    </div>
  )
}
