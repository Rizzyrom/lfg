'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'

interface ChatMessage {
  id: string
  content: string
  username: string
  timestamp: string
  mentions?: string[]
  reactions?: Array<{ emoji: string; users: string[] }>
  attachments?: Array<{ type: string; url: string; name?: string }>
}

interface CachedData {
  chat: ChatMessage[] | null
}

interface DataPrefetchContextType {
  getCachedData: (page: 'chat') => any
  setCachedData: (page: 'chat', data: any) => void
  prefetchPage: (page: 'chat') => Promise<void>
  isPrefetching: (page: 'chat') => boolean
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
  const [cachedData, setCachedDataState] = useState<CachedData>({
    chat: null,
  })
  const prefetchingRef = useRef<Set<string>>(new Set())
  const cachedDataRef = useRef(cachedData)
  cachedDataRef.current = cachedData

  const getCachedData = useCallback((page: 'chat') => {
    return cachedDataRef.current[page]
  }, [])

  const setCachedData = useCallback((page: 'chat', data: any) => {
    setCachedDataState(prev => ({
      ...prev,
      [page]: data,
    }))
  }, [])

  const isPrefetching = useCallback((page: 'chat') => {
    return prefetchingRef.current.has(page)
  }, [])

  const prefetchPage = useCallback(async (page: 'chat') => {
    if (prefetchingRef.current.has(page) || cachedDataRef.current[page]) {
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
      }
    } catch (error) {
      console.error(`Failed to prefetch ${page}:`, error)
    } finally {
      prefetchingRef.current.delete(page)
    }
  }, [setCachedData])

  // Prefetch chat on mount
  useEffect(() => {
    prefetchPage('chat')
  }, [prefetchPage])

  return (
    <DataPrefetchContext.Provider value={{ getCachedData, setCachedData, prefetchPage, isPrefetching }}>
      {children}
    </DataPrefetchContext.Provider>
  )
}
