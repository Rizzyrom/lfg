'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ChatClient from './ChatClient'
import ChatTabs from './ChatTabs'

interface ChatLayoutProps {
  username: string
  userId: string
}

export default function ChatLayout({ username, userId }: ChatLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [mentions, setMentions] = useState<any[]>([])
  const [tickers, setTickers] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSidebarData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSidebarData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSidebarData = async () => {
    try {
      const [mentionsRes, tickersRes, attachmentsRes] = await Promise.all([
        fetch('/api/chat/mentions'),
        fetch('/api/chat/tickers'),
        fetch('/api/chat/attachments'),
      ])

      if (mentionsRes.ok) {
        const data = await mentionsRes.json()
        setMentions(data.mentions || [])
      }

      if (tickersRes.ok) {
        const data = await tickersRes.json()
        setTickers(data.tickers || [])
      }

      if (attachmentsRes.ok) {
        const data = await attachmentsRes.json()
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error('Failed to fetch sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Main Chat */}
      <div className="flex-1 min-w-0">
        <ChatClient username={username} userId={userId} />
      </div>

      {/* Sidebar Toggle Button - Desktop */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="hidden md:flex fixed right-4 top-20 z-30 w-10 h-10 items-center justify-center rounded-full bg-tv-blue text-white shadow-elevation-3 hover:bg-tv-blue-hover transition-all"
      >
        {showSidebar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Swipeable Sidebar - Mobile (bottom sheet) */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-16 top-32 z-40 bg-tv-bg transition-transform duration-300 ${
          showSidebar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-full border-t border-tv-border bg-tv-panel shadow-elevation-4">
          <ChatTabs mentions={mentions} tickers={tickers} attachments={attachments} />
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={`hidden md:block fixed right-0 top-14 bottom-0 w-96 bg-tv-panel border-l border-tv-border shadow-elevation-3 transition-transform duration-300 z-20 ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ChatTabs mentions={mentions} tickers={tickers} attachments={attachments} />
      </div>

      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed right-4 bottom-20 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-tv-blue text-white shadow-elevation-4 active:scale-95 transition-all"
      >
        {showSidebar ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
