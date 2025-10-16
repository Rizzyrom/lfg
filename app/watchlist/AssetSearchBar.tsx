'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchResult {
  symbol: string
  name: string
  type: string
  source: 'crypto' | 'stock'
  coinId?: string
  thumb?: string
}

interface AssetSearchBarProps {
  onAdd: (symbol: string, source: 'crypto' | 'stock') => Promise<void>
  disabled?: boolean
}

export default function AssetSearchBar({ onAdd, disabled }: AssetSearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      setShowResults(false)
      return
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      // Search both crypto and stocks
      const searches: Promise<Response>[] = [
        fetch(`/api/search/crypto?q=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/search/stocks?q=${encodeURIComponent(searchQuery)}`)
      ]

      const responses = await Promise.all(searches)
      const data = await Promise.all(responses.map(r => r.json()))

      const allResults: SearchResult[] = []
      data.forEach(d => {
        if (d.results) {
          allResults.push(...d.results)
        }
      })

      setResults(allResults)
      setShowResults(allResults.length > 0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (result: SearchResult) => {
    try {
      await onAdd(result.symbol, result.source)
      setQuery('')
      setResults([])
      setShowResults(false)
    } catch (error) {
      console.error('Add error:', error)
    }
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          placeholder="Add asset..."
          className="w-full px-3 py-1.5 pr-10 bg-tv-bg border border-tv-border rounded-lg text-tv-text focus:outline-none focus:border-tv-blue focus:ring-1 focus:ring-tv-blue transition-all text-xs"
          disabled={disabled}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-tv-blue border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-tv-bg border border-tv-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.map((result, index) => (
            <button
              key={`${result.source}-${result.symbol}-${index}`}
              onClick={() => handleAdd(result)}
              disabled={disabled}
              className="w-full p-3 hover:bg-tv-chip transition-colors text-left flex items-center gap-3 border-b border-tv-border last:border-b-0"
            >
              {result.thumb && (
                <img
                  src={result.thumb}
                  alt={result.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-tv-text">{result.symbol}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-tv-chip text-tv-text-soft uppercase">
                    {result.source}
                  </span>
                </div>
                <div className="text-sm text-tv-text-soft truncate">{result.name}</div>
              </div>
              <div className="flex-shrink-0 text-tv-blue text-sm font-medium">
                Add
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && results.length === 0 && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-tv-bg border border-tv-border rounded-lg shadow-lg p-4 z-50">
          <p className="text-tv-text-soft text-center">No results found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}
