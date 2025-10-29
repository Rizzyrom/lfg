'use client'

import { useState, useEffect } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import UnifiedFeed from '@/components/UnifiedFeed'
import { useDataPrefetch } from '@/components/DataPrefetchProvider'

interface SearchResult {
  title: string
  url: string
  description: string
}

interface FeedLayoutProps {
  isActive?: boolean
}

export default function FeedLayout({ isActive = true }: FeedLayoutProps = {}) {
  const { getCachedData, setCachedData } = useDataPrefetch()

  const [searchQuery, setSearchQuery] = useState('')
  // Initialize with cached data for instant display
  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    const cached = getCachedData('feed')
    return cached || []
  })
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)

  // Load latest news on mount ONLY when active
  useEffect(() => {
    if (!isActive) return

    // Check if we have cache first
    const cached = getCachedData('feed')
    if (!cached || cached.length === 0) {
      // No cache, fetch immediately
      console.log('[FeedLayout] No cache, fetching immediately')
      loadLatestNews()
    } else {
      // Have cache, show it and fetch fresh data in background
      console.log('[FeedLayout] Using cached data, fetching fresh in background')
      setSearchResults(cached)
      // Fetch fresh data after 1s delay
      setTimeout(() => loadLatestNews(), 1000)
    }
  }, [isActive, getCachedData])

  const loadLatestNews = async (pageNum = 0) => {
    if (pageNum === 0) {
      setSearching(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const res = await fetch('/api/search/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `latest stock market crypto news today page ${pageNum + 1}`
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const freshResults = data.results || []
        if (pageNum === 0) {
          setSearchResults(freshResults)
          // Update cache with fresh data
          setCachedData('feed', freshResults)
        } else {
          setSearchResults(prev => [...prev, ...freshResults])
        }
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Failed to load latest news:', error)
    } finally {
      setSearching(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    loadLatestNews(page + 1)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults([])
    setPage(0)

    try {
      const res = await fetch('/api/search/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Main Feed */}
      <div className="px-4">
        {/* Perplexity Search Bar - Modern iOS-style */}
        <div className="mb-6 sticky top-0 z-10 bg-gradient-to-b from-tv-bg via-tv-bg to-tv-bg/95 backdrop-blur-lg pb-4 pt-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tv-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news, stocks, crypto..."
                className="w-full pl-12 pr-4 py-3.5 bg-tv-panel/50 backdrop-blur-sm text-tv-text placeholder-tv-text-muted rounded-2xl border-2 border-tv-grid/40 focus:outline-none focus:ring-2 focus:ring-tv-blue/30 focus:border-tv-blue/50 transition-all duration-200 shadow-sm font-medium"
                disabled={searching}
                style={{ fontSize: '16px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || searching}
              className="px-6 py-3.5 bg-gradient-to-r from-tv-blue to-tv-blue-hover hover:from-tv-blue-hover hover:to-tv-blue disabled:from-tv-text-muted disabled:to-tv-text-muted disabled:cursor-not-allowed rounded-2xl transition-all duration-300 text-white font-bold shadow-lg shadow-tv-blue/20 hover:shadow-tv-blue/40 disabled:shadow-none active:scale-95"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results - Modern card design */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5 px-3">
                <div className="p-2 bg-gradient-to-br from-tv-blue/15 to-tv-blue/5 rounded-xl">
                  <Search className="w-4 h-4 text-tv-blue" />
                </div>
                <div className="text-sm font-bold text-tv-text">Search Results</div>
              </div>
              {searchResults.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-tv-grid/30 hover:border-tv-blue/50 transition-all duration-300 group shadow-sm hover:shadow-lg active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-tv-text group-hover:text-tv-blue transition-colors duration-200 line-clamp-2 mb-2 leading-snug">
                        {result.title}
                      </h3>
                      <p className="text-sm text-tv-text-soft line-clamp-2 leading-relaxed mb-2">
                        {result.description}
                      </p>
                      <div className="text-xs text-tv-text-muted truncate font-semibold">
                        {new URL(result.url).hostname}
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-tv-text-muted group-hover:text-tv-blue transition-colors duration-200 flex-shrink-0 mt-1" />
                  </div>
                </a>
              ))}

              {/* Load More Button */}
              {searchResults.length > 0 && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full mt-4 px-4 py-4 bg-gradient-to-r from-tv-panel to-tv-panel/80 hover:from-tv-hover hover:to-tv-hover/80 border-2 border-tv-grid/40 rounded-2xl text-tv-text font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.99]"
                >
                  {loadingMore ? 'Loading more articles...' : 'Load More Articles'}
                </button>
              )}
            </div>
          )}
        </div>

        <UnifiedFeed />
      </div>
    </div>
  )
}
