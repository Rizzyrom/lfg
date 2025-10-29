'use client'

import { useEffect, useState } from 'react'
import { useMobileNavigation } from './MobileNavigationProvider'
import PageContainer from './PageContainer'
import ChatClient from '@/app/chat/ChatClient'
import WatchlistClient from '@/app/watchlist/WatchlistClient'
import FeedLayout from '@/app/feed/FeedLayout'

interface MobilePageHubProps {
  userId: string
  username: string
}

/**
 * Mobile Page Hub - Renders all three pages and manages visibility
 * This component enables instant navigation by keeping all pages mounted
 * and using CSS transitions to show/hide them
 */
export default function MobilePageHub({ userId, username }: MobilePageHubProps) {
  const { currentPageIndex, direction, isPageMounted } = useMobileNavigation()
  // Initialize isMobile based on window size immediately to avoid re-render
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // On desktop, just render the current page without the hub
  if (!isMobile) {
    // Render based on current page index (always active on desktop)
    if (currentPageIndex === 0) {
      return (
        <div className="h-[calc(100vh-3.5rem)]">
          <ChatClient username={username} userId={userId} isActive={true} />
        </div>
      )
    } else if (currentPageIndex === 1) {
      return <WatchlistClient isActive={true} />
    } else {
      return <FeedLayout isActive={true} />
    }
  }

  // On mobile, render all pages in containers for instant switching
  // Pass isActive prop to prevent hidden pages from fetching data
  return (
    <div className="relative w-full h-full overflow-hidden">
      <PageContainer
        isActive={currentPageIndex === 0}
        isMounted={isPageMounted(0)}
        direction={direction}
        pageIndex={0}
      >
        <div className="h-[calc(100vh-3.5rem)]">
          <ChatClient username={username} userId={userId} isActive={currentPageIndex === 0} />
        </div>
      </PageContainer>

      <PageContainer
        isActive={currentPageIndex === 1}
        isMounted={isPageMounted(1)}
        direction={direction}
        pageIndex={1}
      >
        <WatchlistClient isActive={currentPageIndex === 1} />
      </PageContainer>

      <PageContainer
        isActive={currentPageIndex === 2}
        isMounted={isPageMounted(2)}
        direction={direction}
        pageIndex={2}
      >
        <FeedLayout isActive={currentPageIndex === 2} />
      </PageContainer>
    </div>
  )
}
