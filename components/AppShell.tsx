'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Settings, LogOut, RefreshCw } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
  leftRail?: ReactNode
  rightRail?: ReactNode
  leftDrawerTitle?: string
  rightDrawerTitle?: string
  pageTitle?: string
}

export default function AppShell({
  children,
  leftRail,
  rightRail,
  leftDrawerTitle = 'Market Trends',
  rightDrawerTitle = 'AI Analysis',
  pageTitle
}: AppShellProps) {
  const pathname = usePathname()
  const [showLeftDrawer, setShowLeftDrawer] = useState(false)
  const [showRightDrawer, setShowRightDrawer] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <div className="h-screen bg-tv-bg flex flex-col overflow-hidden">
      {/* Modern minimal header */}
      <header className="flex-shrink-0 z-50 bg-tv-panel/80 backdrop-blur-xl border-b border-tv-border elevation-1 safe-area-pt">
        <div className="max-w-[1920px] mx-auto pl-4 pr-[7px] sm:pl-6 sm:pr-[7px] h-14 flex items-center justify-between">
          {/* Left: Page title */}
          <div className="flex items-center gap-3">
            {pageTitle && (
              <h1 className="text-[22pt] font-bold text-tv-text">{pageTitle}</h1>
            )}
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <Link
                href="/chat"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/chat'
                    ? 'bg-tv-blue text-white'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                Chat
              </Link>
              <Link
                href="/watchlist"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/watchlist'
                    ? 'bg-tv-blue text-white'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                Watchlist
              </Link>
              <Link
                href="/feed"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/feed'
                    ? 'bg-tv-blue text-white'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                Feed
              </Link>
            </nav>
          </div>

          {/* Right: LFG Logo with dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <span className="text-white text-[12.5px] font-bold leading-none">LFG</span>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-tv-panel border border-tv-border rounded-xl shadow-elevation-4 overflow-hidden">
                <div className="p-2 space-y-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tv-hover text-tv-text transition-all group"
                  >
                    <Settings className="w-4 h-4 text-tv-text-soft group-hover:text-tv-blue transition-colors" />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleRefresh()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tv-hover text-tv-text transition-all group"
                  >
                    <RefreshCw className="w-4 h-4 text-tv-text-soft group-hover:text-tv-blue transition-colors" />
                    <span className="text-sm font-medium">Refresh Data</span>
                  </button>
                  <div className="h-px bg-tv-border my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-tv-down transition-all group"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 max-w-[1920px] mx-auto w-full overflow-hidden pb-[5px]">
        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_360px] xl:grid-cols-[280px_minmax(0,1fr)_380px] gap-3 sm:gap-4 p-3 sm:p-4 h-full">
          {/* Left rail - hidden on mobile */}
          {leftRail && (
            <aside className="hidden lg:block overflow-y-auto">
              <div>{leftRail}</div>
            </aside>
          )}

          {/* Main content - full width on mobile */}
          <main className="min-w-0 w-full h-full overflow-hidden">{children}</main>

          {/* Right rail - hidden on mobile */}
          {rightRail && (
            <aside className="hidden lg:block overflow-y-auto">
              <div>{rightRail}</div>
            </aside>
          )}
        </div>
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

      {/* Bottom navigation indicator - 5px tall, 3 equal segments */}
      <nav className="fixed bottom-0 left-0 right-0 h-[5px] bg-tv-border z-50 flex">
        <Link
          href="/chat"
          className={`flex-1 transition-all ${
            pathname === '/chat' ? 'bg-tv-blue' : 'bg-transparent hover:bg-tv-blue/20'
          }`}
          aria-label="Chat"
        />
        <Link
          href="/watchlist"
          className={`flex-1 transition-all ${
            pathname === '/watchlist' ? 'bg-tv-blue' : 'bg-transparent hover:bg-tv-blue/20'
          }`}
          aria-label="Watchlist"
        />
        <Link
          href="/feed"
          className={`flex-1 transition-all ${
            pathname === '/feed' ? 'bg-tv-blue' : 'bg-transparent hover:bg-tv-blue/20'
          }`}
          aria-label="Feed"
        />
      </nav>
    </div>
  )
}
