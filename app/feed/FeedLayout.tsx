'use client'

import { useState, useEffect } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import UnifiedFeed from '@/components/UnifiedFeed'

interface SearchResult {
  title: string
  url: string
  description: string
}

export default function FeedLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Load latest news on mount
  useEffect(() => {
    loadLatestNews()
  }, [])

  const loadLatestNews = async () => {
    setSearching(true)
    try {
      const res = await fetch('/api/search/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'latest stock market crypto news today' }),
      })

      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Failed to load latest news:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults([])

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
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto py-4">
      {/* Main Feed */}
      <div className="px-4">
        {/* Perplexity Search Bar */}
        <div className="mb-4 sticky top-0 z-10 bg-tv-bg/95 backdrop-blur-sm pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tv-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news, stocks, crypto..."
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
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Search className="w-4 h-4 text-tv-blue" />
                <div className="text-sm font-medium text-tv-text-soft">Search Results</div>
              </div>
              {searchResults.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-tv-panel rounded-lg border border-tv-grid hover:border-tv-blue transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-tv-text group-hover:text-tv-blue transition-colors line-clamp-2 mb-1">
                        {result.title}
                      </h3>
                      <p className="text-sm text-tv-text-soft line-clamp-2">
                        {result.description}
                      </p>
                      <div className="mt-2 text-xs text-tv-text-muted truncate">
                        {new URL(result.url).hostname}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-tv-text-muted group-hover:text-tv-blue transition-colors flex-shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <UnifiedFeed />
      </div>
    </div>
  )
}
