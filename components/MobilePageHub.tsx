'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useMobileNavigation } from './MobileNavigationProvider'
import PageContainer from './PageContainer'
import dynamic from 'next/dynamic'

// Dynamically import page clients for code splitting
const ChatClient = dynamic(() => import('@/app/chat/ChatClient'), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-tv-text-soft">Loading chat...</div></div>,
})

const WatchlistClient = dynamic(() => import('@/app/watchlist/WatchlistClient'), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-tv-text-soft">Loading markets...</div></div>,
})

const FeedLayout = dynamic(() => import('@/app/feed/FeedLayout'), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-tv-text-soft">Loading feed...</div></div>,
})

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
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // On desktop, just render the current page without the hub
  if (!isMobile) {
    // Render based on current page index
    if (currentPageIndex === 0) {
      return (
        <div className="h-[calc(100vh-3.5rem)]">
          <ChatClient username={username} userId={userId} />
        </div>
      )
    } else if (currentPageIndex === 1) {
      return <WatchlistClient />
    } else {
      return <FeedLayout />
    }
  }

  // On mobile, render all pages in containers for instant switching
  return (
    <div className="relative w-full h-full overflow-hidden">
      <PageContainer
        isActive={currentPageIndex === 0}
        isMounted={isPageMounted(0)}
        direction={direction}
        pageIndex={0}
      >
        <div className="h-[calc(100vh-3.5rem)]">
          <ChatClient username={username} userId={userId} />
        </div>
      </PageContainer>

      <PageContainer
        isActive={currentPageIndex === 1}
        isMounted={isPageMounted(1)}
        direction={direction}
        pageIndex={1}
      >
        <WatchlistClient />
      </PageContainer>

      <PageContainer
        isActive={currentPageIndex === 2}
        isMounted={isPageMounted(2)}
        direction={direction}
        pageIndex={2}
      >
        <FeedLayout />
      </PageContainer>
    </div>
  )
}
