'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import { useMobileNavigation } from './MobileNavigationProvider'

interface ChatMessage {
  id: string
  content: string
  username: string
  timestamp: string
  mentions?: string[]
  reactions?: Array<{ emoji: string; users: string[] }>
  attachments?: Array<{ type: string; url: string; name?: string }>
}

interface WatchItem {
  id: string
  symbol: string
  source: string
  tags: string[]
  price?: string | null
  change24h?: string | null
  change30d?: string | null
  mentionCount?: number
}

interface SearchResult {
  title: string
  url: string
  description: string
}

interface CachedData {
  chat: ChatMessage[] | null
  watchlist: WatchItem[] | null
  feed: SearchResult[] | null
}

interface DataPrefetchContextType {
  getCachedData: (page: 'chat' | 'watchlist' | 'feed') => any
  setCachedData: (page: 'chat' | 'watchlist' | 'feed', data: any) => void
  prefetchPage: (page: 'chat' | 'watchlist' | 'feed') => Promise<void>
  isPrefetching: (page: 'chat' | 'watchlist' | 'feed') => boolean
}

const DataPrefetchContext = createContext<DataPrefetchContextType | null>(null)

export function useDataPrefetch() {
  const context = useContext(DataPrefetchContext)
  if (!context) {
    throw new Error('useDataPrefetch must be used within DataPrefetchProvider')
  }
  return context
}

interface DataPrefetchProviderProps {
  children: React.ReactNode
}

export default function DataPrefetchProvider({ children }: DataPrefetchProviderProps) {
  const { currentPageIndex } = useMobileNavigation()
  const [cachedData, setCachedDataState] = useState<CachedData>({
    chat: null,
    watchlist: null,
    feed: null,
  })
  const prefetchingRef = useRef<Set<string>>(new Set())
  const prefetchTimersRef = useRef<NodeJS.Timeout[]>([])
  const lastPageIndexRef = useRef(currentPageIndex)

  const getCachedData = useCallback((page: 'chat' | 'watchlist' | 'feed') => {
    return cachedData[page]
  }, [cachedData])

  const setCachedData = useCallback((page: 'chat' | 'watchlist' | 'feed', data: any) => {
    setCachedDataState(prev => ({
      ...prev,
      [page]: data,
    }))
  }, [])

  const isPrefetching = useCallback((page: 'chat' | 'watchlist' | 'feed') => {
    return prefetchingRef.current.has(page)
  }, [])

  const prefetchPage = useCallback(async (page: 'chat' | 'watchlist' | 'feed') => {
    // Don't prefetch if already prefetching or data exists
    if (prefetchingRef.current.has(page) || cachedData[page]) {
      return
    }

    prefetchingRef.current.add(page)

    try {
      if (page === 'chat') {
        const res = await fetch('/api/chat')
        if (res.ok) {
          const data = await res.json()
          setCachedData('chat', data.messages || [])
        }
      } else if (page === 'watchlist') {
        const res = await fetch('/api/watchlist/prices')
        if (res.ok) {
          const data = await res.json()
          setCachedData('watchlist', data.items || [])
        }
      } else if (page === 'feed') {
        const res = await fetch('/api/search/perplexity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'latest stock market crypto news today page 1' }),
        })
        if (res.ok) {
          const data = await res.json()
          setCachedData('feed', data.results || [])
        }
      }
    } catch (error) {
      console.error(`Failed to prefetch ${page}:`, error)
    } finally {
      prefetchingRef.current.delete(page)
    }
  }, [cachedData, setCachedData])

  // Immediate Markets prefetch on app mount - ensure Markets is always ready
  useEffect(() => {
    console.log('[DataPrefetch] App mounted - immediately prefetching Markets data...')
    prefetchPage('watchlist')
  }, []) // Empty array = runs once on mount

  // Adjacent page prefetching - trigger 2-3 seconds after page becomes stable
  useEffect(() => {
    // Clear existing timers
    prefetchTimersRef.current.forEach(timer => clearTimeout(timer))
    prefetchTimersRef.current = []

    // Determine which pages to prefetch based on current page
    const pagesToPrefetch: Array<'chat' | 'watchlist' | 'feed'> = []

    if (currentPageIndex === 0) {
      // On Chat page, prefetch Markets (most likely next)
      pagesToPrefetch.push('watchlist')
    } else if (currentPageIndex === 1) {
      // On Markets page, prefetch both Chat and Feed
      pagesToPrefetch.push('chat', 'feed')
    } else if (currentPageIndex === 2) {
      // On Feed page, prefetch Markets
      pagesToPrefetch.push('watchlist')
    }

    // Schedule prefetching with staggered delays
    pagesToPrefetch.forEach((page, index) => {
      const delay = 2000 + (index * 1000) // 2s, 3s, etc.
      const timer = setTimeout(() => {
        // Only prefetch if we're still on the same page
        if (currentPageIndex === lastPageIndexRef.current) {
          console.log(`[DataPrefetch] Prefetching ${page} data in background...`)
          prefetchPage(page)
        }
      }, delay)
      prefetchTimersRef.current.push(timer)
    })

    lastPageIndexRef.current = currentPageIndex

    return () => {
      prefetchTimersRef.current.forEach(timer => clearTimeout(timer))
      prefetchTimersRef.current = []
    }
  }, [currentPageIndex, prefetchPage])

  return (
    <DataPrefetchContext.Provider value={{ getCachedData, setCachedData, prefetchPage, isPrefetching }}>
      {children}
    </DataPrefetchContext.Provider>
  )
}
