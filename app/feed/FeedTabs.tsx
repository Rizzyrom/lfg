'use client'

import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface FeedTabsProps {
  gainers: MarketMover[]
  losers: MarketMover[]
}

export default function FeedTabs({ gainers, losers }: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'gainers' | 'losers'>('feed')

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === 'feed') setActiveTab('gainers')
      else if (activeTab === 'gainers') setActiveTab('losers')
    },
    onSwipedRight: () => {
      if (activeTab === 'losers') setActiveTab('gainers')
      else if (activeTab === 'gainers') setActiveTab('feed')
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  const tabs = [
    { id: 'feed' as const, label: 'Feed', icon: Activity },
    { id: 'gainers' as const, label: 'Gainers', icon: TrendingUp, count: gainers.length },
    { id: 'losers' as const, label: 'Losers', icon: TrendingDown, count: losers.length },
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
    return num.toFixed(2)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-tv-border bg-tv-panel">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-tv-blue border-b-2 border-tv-blue'
                  : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-tv-blue/20 text-tv-blue text-xs font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div {...handlers} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-tv-blue mx-auto mb-3" />
                <p className="text-tv-text font-semibold mb-2">Feed View Active</p>
                <p className="text-tv-text-soft text-sm">
                  Swipe left or click tabs to view top gainers and losers
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'gainers' && (
            <motion.div
              key="gainers"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-tv-text flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-tv-up" />
                  Top Gainers
                </h3>
                <p className="text-xs text-tv-text-soft mt-1">24h performance leaders</p>
              </div>

              {gainers.length === 0 ? (
                <div className="card p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-tv-text-soft mx-auto mb-3" />
                  <p className="text-tv-text-soft text-sm">No gainers data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gainers.map((mover, index) => (
                    <div key={mover.symbol} className="card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-tv-text-soft">#{index + 1}</span>
                          <div>
                            <h4 className="font-bold text-tv-text text-sm">{mover.symbol}</h4>
                            <p className="text-xs text-tv-text-soft truncate max-w-[150px]">{mover.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-tv-text">${mover.price.toFixed(2)}</p>
                          <p className="text-xs font-bold text-tv-up">+{mover.changePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-tv-text-soft">
                        <span>Vol: {formatNumber(mover.volume)}</span>
                        <span className="text-tv-up">+${Math.abs(mover.change).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'losers' && (
            <motion.div
              key="losers"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-tv-text flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-tv-down" />
                  Top Losers
                </h3>
                <p className="text-xs text-tv-text-soft mt-1">24h performance laggards</p>
              </div>

              {losers.length === 0 ? (
                <div className="card p-6 text-center">
                  <TrendingDown className="w-12 h-12 text-tv-text-soft mx-auto mb-3" />
                  <p className="text-tv-text-soft text-sm">No losers data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {losers.map((mover, index) => (
                    <div key={mover.symbol} className="card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-tv-text-soft">#{index + 1}</span>
                          <div>
                            <h4 className="font-bold text-tv-text text-sm">{mover.symbol}</h4>
                            <p className="text-xs text-tv-text-soft truncate max-w-[150px]">{mover.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-tv-text">${mover.price.toFixed(2)}</p>
                          <p className="text-xs font-bold text-tv-down">{mover.changePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-tv-text-soft">
                        <span>Vol: {formatNumber(mover.volume)}</span>
                        <span className="text-tv-down">-${Math.abs(mover.change).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
