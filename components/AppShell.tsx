'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogOut, RefreshCw, MessageSquare, ChevronDown } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
  pageTitle?: string
}

export default function AppShell({
  children,
  pageTitle
}: AppShellProps) {
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

  return (
    <div className="h-screen bg-tv-bg flex flex-col overflow-hidden">
      {/* Clean Header */}
      <header className="flex-shrink-0 z-50 bg-white border-b border-tv-border safe-area-pt">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/chat" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-tv-text rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white text-[10px] font-bold tracking-tight">LFG</span>
            </div>
            {pageTitle && (
              <h1 className="text-lg font-bold text-tv-text hidden sm:block">{pageTitle}</h1>
            )}
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-tv-bg-secondary transition-all active:scale-95 touch-manipulation"
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-tv-border rounded-xl shadow-elevation-4 overflow-hidden animate-scale-in">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-tv-down-soft text-tv-down transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - full width, clean */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
