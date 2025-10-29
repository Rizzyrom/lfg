'use client'

import { useMemo } from 'react'
import AppShell from './AppShell'
import WatchlistRail from './WatchlistRail'
import TrendingRail from './TrendingRail'
import RightRail from './RightRail'
import MobileSwipeContainer from './MobileSwipeContainer'
import MobilePageHub from './MobilePageHub'
import MobileNavigationProvider from './MobileNavigationProvider'
import DataPrefetchProvider from './DataPrefetchProvider'
import { usePathname } from 'next/navigation'

interface UnifiedMobileLayoutProps {
  userId: string
  username: string
}

/**
 * Unified layout for mobile navigation
 * Wraps all three pages (Chat, Markets, Feed) in a single AppShell
 * Enables instant navigation by keeping pages mounted
 */
export default function UnifiedMobileLayout({ userId, username }: UnifiedMobileLayoutProps) {
  const pathname = usePathname()

  // Determine page configuration based on current route
  const pageConfig = useMemo(() => {
    switch (pathname) {
      case '/chat':
        return {
          leftRail: <WatchlistRail />,
          leftDrawerTitle: 'Watchlist',
          rightDrawerTitle: 'AI Pulse',
          pageTitle: '@ CHAT',
        }
      case '/watchlist':
        return {
          leftRail: <WatchlistRail />,
          leftDrawerTitle: 'Watchlist',
          rightDrawerTitle: 'AI Pulse',
          pageTitle: '$ MARKETS',
        }
      case '/feed':
        return {
          leftRail: <TrendingRail />,
          leftDrawerTitle: 'Top Gainers & Losers',
          rightDrawerTitle: 'AI Pulse',
          pageTitle: '# NEWS',
        }
      default:
        return {
          leftRail: <WatchlistRail />,
          leftDrawerTitle: 'Watchlist',
          rightDrawerTitle: 'AI Pulse',
          pageTitle: '@ CHAT',
        }
    }
  }, [pathname])

  return (
    <MobileNavigationProvider initialPage={pathname as any}>
      <DataPrefetchProvider>
        <AppShell
          leftRail={pageConfig.leftRail}
          rightRail={<RightRail />}
          leftDrawerTitle={pageConfig.leftDrawerTitle}
          rightDrawerTitle={pageConfig.rightDrawerTitle}
          pageTitle={pageConfig.pageTitle}
        >
          <MobileSwipeContainer>
            <MobilePageHub userId={userId} username={username} />
          </MobileSwipeContainer>
        </AppShell>
      </DataPrefetchProvider>
    </MobileNavigationProvider>
  )
}
