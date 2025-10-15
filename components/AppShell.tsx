'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AppShellProps {
  children: ReactNode
  leftRail?: ReactNode
  rightRail?: ReactNode
  leftDrawerTitle?: string
  rightDrawerTitle?: string
}

export default function AppShell({
  children,
  leftRail,
  rightRail,
  leftDrawerTitle = 'Market Trends',
  rightDrawerTitle = 'AI Analysis'
}: AppShellProps) {
  const pathname = usePathname()
  const [showLeftDrawer, setShowLeftDrawer] = useState(false)
  const [showRightDrawer, setShowRightDrawer] = useState(false)

  const handleRefresh = async () => {
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert('Market data refresh triggered!')
      }
    } catch (error) {
      console.error('Refresh failed:', error)
      alert('Failed to refresh market data')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-tv-bg">
      {/* Top bar - Minimal design */}
      <header className="sticky top-0 z-50 bg-tv-panel border-b border-tv-grid elevation-1 safe-area-pt">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/feed" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-tv-blue flex items-center justify-center transition-all group-hover:shadow-glow-blue">
                <span className="text-white font-bold text-lg">LFG</span>
              </div>
            </Link>
            <nav className="hidden md:flex gap-1">
              <Link
                href="/feed"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/feed'
                    ? 'bg-tv-chip text-tv-text'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                Feed
              </Link>
              <Link
                href="/watchlist"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/watchlist'
                    ? 'bg-tv-chip text-tv-text'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                Watchlist
              </Link>
              <Link
                href="/chat"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/chat'
                    ? 'bg-tv-chip text-tv-text'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                Chat
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile sidebar toggles */}
            {leftRail && (
              <button
                onClick={() => setShowLeftDrawer(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text transition-all active:scale-95 touch-manipulation"
                aria-label="Open market trends"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </button>
            )}
            {rightRail && (
              <button
                onClick={() => setShowRightDrawer(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text transition-all active:scale-95 touch-manipulation"
                aria-label="Open AI insights"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="hidden sm:flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text text-sm font-semibold transition-all active:scale-95"
              aria-label="Refresh market data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden lg:inline">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-all active:scale-95"
              aria-label="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-[1920px] mx-auto">
        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_360px] xl:grid-cols-[280px_minmax(0,1fr)_380px] gap-3 sm:gap-4 p-3 sm:p-4 pb-20 lg:pb-4">
          {/* Left rail - hidden on mobile */}
          {leftRail && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">{leftRail}</div>
            </aside>
          )}

          {/* Main content - full width on mobile */}
          <main className="min-w-0 w-full">{children}</main>

          {/* Right rail - hidden on mobile */}
          {rightRail && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">{rightRail}</div>
            </aside>
          )}
        </div>

        {/* Mobile bottom nav - only show on mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-tv-panel/95 backdrop-blur-xl border-t border-tv-grid elevation-4 z-50">
          <div className="flex justify-around items-center h-16 px-1 safe-area-pb">
            <Link
              href="/feed"
              className={`flex flex-col items-center gap-1 px-6 py-2 min-h-[56px] min-w-[72px] rounded-xl transition-all active:scale-90 touch-manipulation ${
                pathname === '/feed'
                  ? 'text-tv-blue'
                  : 'text-tv-text-soft'
              }`}
            >
              <div className={`relative ${pathname === '/feed' ? 'animate-pulse' : ''}`}>
                <svg className="w-7 h-7" fill={pathname === '/feed' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/feed' ? 0 : 2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {pathname === '/feed' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-tv-blue rounded-full shadow-glow-blue" />
                )}
              </div>
              <span className="text-[11px] font-bold">Feed</span>
            </Link>
            <Link
              href="/watchlist"
              className={`flex flex-col items-center gap-1 px-6 py-2 min-h-[56px] min-w-[72px] rounded-xl transition-all active:scale-90 touch-manipulation ${
                pathname === '/watchlist'
                  ? 'text-tv-blue'
                  : 'text-tv-text-soft'
              }`}
            >
              <div className={`relative ${pathname === '/watchlist' ? 'animate-pulse' : ''}`}>
                <svg className="w-7 h-7" fill={pathname === '/watchlist' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/watchlist' ? 0 : 2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {pathname === '/watchlist' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-tv-blue rounded-full shadow-glow-blue" />
                )}
              </div>
              <span className="text-[11px] font-bold">Watch</span>
            </Link>
            <Link
              href="/chat"
              className={`flex flex-col items-center gap-1 px-6 py-2 min-h-[56px] min-w-[72px] rounded-xl transition-all active:scale-90 touch-manipulation ${
                pathname === '/chat'
                  ? 'text-tv-blue'
                  : 'text-tv-text-soft'
              }`}
            >
              <div className={`relative ${pathname === '/chat' ? 'animate-pulse' : ''}`}>
                <svg className="w-7 h-7" fill={pathname === '/chat' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/chat' ? 0 : 2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {pathname === '/chat' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-tv-blue rounded-full shadow-glow-blue" />
                )}
              </div>
              <span className="text-[11px] font-bold">Chat</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Left Drawer (Top Gainers/Losers) */}
      {showLeftDrawer && leftRail && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setShowLeftDrawer(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-tv-panel elevation-4 overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: '0.25s' }}
          >
            <div className="sticky top-0 bg-tv-panel/95 backdrop-blur-xl border-b border-tv-grid p-4 flex items-center justify-between elevation-1 z-10">
              <h2 className="text-lg font-bold text-tv-text">{leftDrawerTitle}</h2>
              <button
                onClick={() => setShowLeftDrawer(false)}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tv-chip hover:bg-tv-hover flex items-center justify-center transition-all active:scale-95 touch-manipulation"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5 text-tv-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">{leftRail}</div>
          </div>
        </div>
      )}

      {/* Mobile Right Drawer (AI Pulse & Watchlist) */}
      {showRightDrawer && rightRail && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setShowRightDrawer(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-tv-panel elevation-4 overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: '0.25s', animationDirection: 'reverse' }}
          >
            <div className="sticky top-0 bg-tv-panel/95 backdrop-blur-xl border-b border-tv-grid p-4 flex items-center justify-between elevation-1 z-10">
              <h2 className="text-lg font-bold text-tv-text">{rightDrawerTitle}</h2>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tv-chip hover:bg-tv-hover flex items-center justify-center transition-all active:scale-95 touch-manipulation"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5 text-tv-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">{rightRail}</div>
          </div>
        </div>
      )}
    </div>
  )
}
