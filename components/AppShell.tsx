'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, LogOut, RefreshCw, MessageSquare, Star, Newspaper, ChevronDown } from 'lucide-react'

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        // Silently refresh - no alert needed
      }
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
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

  const navItems = [
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/watchlist', label: 'Watchlist', icon: Star },
    { href: '/feed', label: 'Feed', icon: Newspaper },
  ]

  return (
    <div className="h-screen bg-tv-bg flex flex-col overflow-hidden">
      {/* Premium Header */}
      <header className="flex-shrink-0 z-50 bg-white border-b border-tv-border safe-area-pt">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/chat" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-tv-text rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-white text-[11px] font-bold tracking-tight">LFG</span>
              </div>
              {pageTitle && (
                <h1 className="text-xl font-bold text-tv-text hidden sm:block">{pageTitle}</h1>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-tv-blue text-white shadow-sm'
                        : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-lg hover:bg-tv-bg-secondary transition-all active:scale-95 touch-manipulation"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-tv-text-soft ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-tv-bg-secondary transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tv-blue to-tv-purple flex items-center justify-center">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-tv-text-soft transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-tv-border rounded-xl shadow-elevation-4 overflow-hidden animate-scale-in">
                  <div className="p-2 space-y-1">
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-tv-bg-secondary text-tv-text transition-all group"
                    >
                      <Settings className="w-4.5 h-4.5 text-tv-text-soft group-hover:text-tv-blue transition-colors" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                    <div className="h-px bg-tv-border mx-2" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-tv-down-soft text-tv-down transition-all"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 max-w-[1920px] mx-auto w-full overflow-hidden">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_380px] xl:grid-cols-[300px_minmax(0,1fr)_400px] gap-4 p-4 h-full">
          {/* Left rail - hidden on mobile */}
          {leftRail && (
            <aside className="hidden lg:block overflow-y-auto scrollbar-hide">
              <div className="animate-fade-in">{leftRail}</div>
            </aside>
          )}

          {/* Main content - full width on mobile */}
          <main className="min-w-0 w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
            {children}
          </main>

          {/* Right rail - hidden on mobile */}
          {rightRail && (
            <aside className="hidden lg:block overflow-y-auto scrollbar-hide">
              <div className="animate-fade-in">{rightRail}</div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Left Drawer */}
      {showLeftDrawer && leftRail && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setShowLeftDrawer(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-elevation-4 overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-tv-border p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-tv-text">{leftDrawerTitle}</h2>
              <button
                onClick={() => setShowLeftDrawer(false)}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tv-bg-secondary hover:bg-tv-chip flex items-center justify-center transition-all active:scale-95 touch-manipulation"
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

      {/* Mobile Right Drawer */}
      {showRightDrawer && rightRail && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setShowRightDrawer(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-elevation-4 overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDirection: 'reverse' }}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-tv-border p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-tv-text">{rightDrawerTitle}</h2>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tv-bg-secondary hover:bg-tv-chip flex items-center justify-center transition-all active:scale-95 touch-manipulation"
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

      {/* Premium Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-tv-border z-50 md:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
                  isActive
                    ? 'text-tv-blue'
                    : 'text-tv-text-muted hover:text-tv-text-soft'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-tv-blue-soft' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-tv-blue' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
