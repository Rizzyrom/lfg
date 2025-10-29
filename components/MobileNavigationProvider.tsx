'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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

  // Mount current page and adjacent pages for instant navigation
  useEffect(() => {
    const pagesToMount = new Set<number>()

    // Always mount current page
    pagesToMount.add(currentPageIndex)

    // Mount previous page if exists
    if (currentPageIndex > 0) {
      pagesToMount.add(currentPageIndex - 1)
    }

    // Mount next page if exists
    if (currentPageIndex < PAGES.length - 1) {
      pagesToMount.add(currentPageIndex + 1)
    }

    setMountedPages(pagesToMount)
  }, [currentPageIndex]) // Re-run when page changes to preload new adjacent pages

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
