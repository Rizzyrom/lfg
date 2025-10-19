'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import UnifiedFeed from '@/components/UnifiedFeed'

export default function FeedLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string>('')
  const [searching, setSearching] = useState(false)

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
          {searchResults && (
            <div className="mt-3 p-4 bg-tv-panel rounded-lg border border-tv-grid">
              <div className="flex items-start gap-2 mb-2">
                <Search className="w-4 h-4 text-tv-blue mt-0.5 flex-shrink-0" />
                <div className="text-sm font-medium text-tv-text-soft">Brave Search</div>
              </div>
              <div className="text-sm text-tv-text whitespace-pre-wrap">{searchResults}</div>
            </div>
          )}
        </div>

        <UnifiedFeed />
      </div>
    </div>
  )
}
