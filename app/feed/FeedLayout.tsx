'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import UnifiedFeed from '@/components/UnifiedFeed'
import FeedTabs from './FeedTabs'

interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

export default function FeedLayout() {
  const [showSidebar, setShowSidebar] = useState(false)
  const [gainers, setGainers] = useState<MarketMover[]>([])
  const [losers, setLosers] = useState<MarketMover[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string>('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchMarketMovers()
    const interval = setInterval(fetchMarketMovers, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchMarketMovers = async () => {
    try {
      const res = await fetch('/api/market/movers')
      if (res.ok) {
        const data = await res.json()
        setGainers(data.gainers || [])
        setLosers(data.losers || [])
      }
    } catch (error) {
      console.error('Failed to fetch market movers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults('')

    try {
      const res = await fetch('/api/search/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.answer || 'No results found')
      } else {
        setSearchResults('Failed to search. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults('Failed to search. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Main Feed */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {/* Perplexity Search Bar */}
        <div className="mb-4 sticky top-0 z-10 bg-tv-bg/95 backdrop-blur-sm pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tv-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask Perplexity anything about markets..."
                className="w-full pl-10 pr-4 py-2 bg-tv-panel text-tv-text placeholder-tv-text-muted rounded-lg border border-tv-grid/60 focus:outline-none focus:ring-1 focus:ring-tv-blue focus:border-tv-blue transition-all"
                disabled={searching}
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || searching}
              className="px-4 py-2 bg-tv-blue hover:bg-tv-blue-hover disabled:bg-tv-text-muted disabled:cursor-not-allowed rounded-lg transition-all text-white font-medium"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-3 p-4 bg-tv-panel rounded-lg border border-tv-grid">
              <div className="flex items-start gap-2 mb-2">
                <Search className="w-4 h-4 text-tv-blue mt-0.5 flex-shrink-0" />
                <div className="text-sm font-medium text-tv-text-soft">Perplexity AI</div>
              </div>
              <div className="text-sm text-tv-text whitespace-pre-wrap">{searchResults}</div>
            </div>
          )}
        </div>

        <UnifiedFeed />
      </div>

      {/* Sidebar Toggle Button - Desktop */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="hidden md:flex fixed right-4 top-20 z-30 w-10 h-10 items-center justify-center rounded-full bg-tv-blue text-white shadow-elevation-3 hover:bg-tv-blue-hover transition-all"
      >
        {showSidebar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Swipeable Sidebar - Mobile (bottom sheet) */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-16 top-32 z-40 bg-tv-bg transition-transform duration-300 ${
          showSidebar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-full border-t border-tv-border bg-tv-panel shadow-elevation-4">
          <FeedTabs gainers={gainers} losers={losers} />
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={`hidden md:block fixed right-0 top-14 bottom-0 w-96 bg-tv-panel border-l border-tv-border shadow-elevation-3 transition-transform duration-300 z-20 ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <FeedTabs gainers={gainers} losers={losers} />
      </div>

      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed right-4 bottom-20 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-tv-blue text-white shadow-elevation-4 active:scale-95 transition-all"
      >
        {showSidebar ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
