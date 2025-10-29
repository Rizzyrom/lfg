'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

// Page routes
const PAGES = ['/chat', '/watchlist', '/feed'] as const
type PageRoute = typeof PAGES[number]

interface MobileNavigationContextType {
  currentPageIndex: number
  navigateToPage: (index: number) => void
  direction: number
  isPageMounted: (index: number) => boolean
}

const MobileNavigationContext = createContext<MobileNavigationContextType | null>(null)

export function useMobileNavigation() {
  const context = useContext(MobileNavigationContext)
  if (!context) {
    throw new Error('useMobileNavigation must be used within MobileNavigationProvider')
  }
  return context
}

interface Props {
  children: ReactNode
  initialPage: PageRoute
}

export default function MobileNavigationProvider({ children, initialPage }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentPageIndex, setCurrentPageIndex] = useState(() => {
    const index = PAGES.indexOf(initialPage)
    return index === -1 ? 0 : index
  })
  const [direction, setDirection] = useState(0)
  const [mountedPages, setMountedPages] = useState<Set<number>>(new Set([currentPageIndex]))

  // Sync with URL changes (for back/forward browser navigation and link clicks)
  useEffect(() => {
    const newIndex = PAGES.indexOf(pathname as PageRoute)
    if (newIndex !== -1 && newIndex !== currentPageIndex) {
      setDirection(newIndex > currentPageIndex ? -1 : 1)
      setCurrentPageIndex(newIndex)
      // Ensure the new page is mounted
      setMountedPages(prev => new Set([...prev, newIndex]))
    }
  }, [pathname, currentPageIndex])

  // Progressive background mounting
  useEffect(() => {
    // Mount the current page immediately
    setMountedPages(prev => new Set([...prev, currentPageIndex]))

    // After a short delay, start mounting other pages in the background
    const timer = setTimeout(() => {
      const allPageIndices = [0, 1, 2]
      const pagesToMount = allPageIndices.filter(idx => !mountedPages.has(idx))

      // Mount pages one by one with a small delay between each
      pagesToMount.forEach((pageIdx, i) => {
        setTimeout(() => {
          setMountedPages(prev => new Set([...prev, pageIdx]))
        }, i * 500) // 500ms between each background mount
      })
    }, 1500) // Wait 1.5s after initial page is interactive

    return () => clearTimeout(timer)
  }, []) // Only run once on mount

  const navigateToPage = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= PAGES.length || targetIndex === currentPageIndex) {
      return
    }

    // Update direction for animation
    setDirection(targetIndex > currentPageIndex ? -1 : 1)

    // Ensure target page is mounted
    setMountedPages(prev => new Set([...prev, targetIndex]))

    // Update current page
    setCurrentPageIndex(targetIndex)

    // Sync URL without triggering a full navigation (no page reload)
    router.replace(PAGES[targetIndex], { scroll: false })
  }, [currentPageIndex, router])

  const isPageMounted = useCallback((index: number) => {
    return mountedPages.has(index)
  }, [mountedPages])

  return (
    <MobileNavigationContext.Provider
      value={{
        currentPageIndex,
        navigateToPage,
        direction,
        isPageMounted,
      }}
    >
      {children}
    </MobileNavigationContext.Provider>
  )
}
