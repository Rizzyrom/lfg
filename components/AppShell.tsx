'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AppShellProps {
  children: ReactNode
  leftRail?: ReactNode
  rightRail?: ReactNode
}

export default function AppShell({ children, leftRail, rightRail }: AppShellProps) {
  const pathname = usePathname()

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
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-tv-panel border-b border-tv-grid backdrop-blur-xl bg-opacity-95">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/feed" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-tv-blue to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-tv-blue/50 transition-all">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-black text-tv-text tracking-tight">
                LFG
              </span>
            </Link>
            <nav className="hidden md:flex gap-2">
              <Link
                href="/feed"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/feed'
                    ? 'bg-tv-blue text-white shadow-lg shadow-tv-blue/30'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-chip'
                }`}
              >
                Feed
              </Link>
              <Link
                href="/watchlist"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/watchlist'
                    ? 'bg-tv-blue text-white shadow-lg shadow-tv-blue/30'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-chip'
                }`}
              >
                Watchlist
              </Link>
              <Link
                href="/chat"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/chat'
                    ? 'bg-tv-blue text-white shadow-lg shadow-tv-blue/30'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-chip'
                }`}
              >
                Chat
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text text-sm font-medium transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden lg:inline">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all active:scale-95"
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-tv-panel/95 backdrop-blur-xl border-t border-tv-grid shadow-2xl">
          <div className="flex justify-around items-center h-16 px-1 safe-area-inset-bottom">
            <Link
              href="/feed"
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95 ${
                pathname === '/feed'
                  ? 'text-tv-blue'
                  : 'text-tv-text-soft hover:text-tv-text'
              }`}
            >
              <div className={`relative ${pathname === '/feed' ? 'animate-pulse' : ''}`}>
                <svg className="w-6 h-6" fill={pathname === '/feed' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/feed' ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {pathname === '/feed' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-tv-blue rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-semibold">Feed</span>
            </Link>
            <Link
              href="/watchlist"
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95 ${
                pathname === '/watchlist'
                  ? 'text-tv-blue'
                  : 'text-tv-text-soft hover:text-tv-text'
              }`}
            >
              <div className={`relative ${pathname === '/watchlist' ? 'animate-pulse' : ''}`}>
                <svg className="w-6 h-6" fill={pathname === '/watchlist' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/watchlist' ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {pathname === '/watchlist' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-tv-blue rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-semibold">Watch</span>
            </Link>
            <Link
              href="/chat"
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95 ${
                pathname === '/chat'
                  ? 'text-tv-blue'
                  : 'text-tv-text-soft hover:text-tv-text'
              }`}
            >
              <div className={`relative ${pathname === '/chat' ? 'animate-pulse' : ''}`}>
                <svg className="w-6 h-6" fill={pathname === '/chat' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/chat' ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {pathname === '/chat' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-tv-blue rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-semibold">Chat</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
