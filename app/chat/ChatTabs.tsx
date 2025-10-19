'use client'

import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, AtSign, TrendingUp, Paperclip } from 'lucide-react'

interface ChatTabsProps {
  mentions: Array<{ id: string; username: string; message: string; timestamp: string }>
  tickers: Array<{ symbol: string; mentions: number; sentiment: 'bullish' | 'bearish' | 'neutral' }>
  attachments: Array<{ id: string; filename: string; url: string; type: string; uploadedBy: string; timestamp: string }>
}

export default function ChatTabs({ mentions, tickers, attachments }: ChatTabsProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'mentions' | 'tickers' | 'attachments'>('chat')

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === 'chat') setActiveTab('mentions')
      else if (activeTab === 'mentions') setActiveTab('tickers')
      else if (activeTab === 'tickers') setActiveTab('attachments')
    },
    onSwipedRight: () => {
      if (activeTab === 'attachments') setActiveTab('tickers')
      else if (activeTab === 'tickers') setActiveTab('mentions')
      else if (activeTab === 'mentions') setActiveTab('chat')
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle, count: null },
    { id: 'mentions', label: 'Mentions', icon: AtSign, count: mentions.length },
    { id: 'tickers', label: 'Tickers', icon: TrendingUp, count: tickers.length },
    { id: 'attachments', label: 'Files', icon: Paperclip, count: attachments.length },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Tab Headers */}
      <div className="flex-shrink-0 bg-tv-panel">
        <div className="flex items-center justify-around px-2 h-12">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-tv-blue text-white'
                    : 'text-tv-text-soft hover:text-tv-text hover:bg-tv-hover'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-tv-chip'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div {...handlers} className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto p-4"
            >
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-tv-blue mx-auto mb-3" />
                <p className="text-tv-text font-semibold mb-2">Chat View Active</p>
                <p className="text-tv-text-soft text-sm">
                  Swipe left or click tabs to view mentions, tickers, and files
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'mentions' && (
            <motion.div
              key="mentions"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto p-4"
            >
              <h2 className="text-lg font-bold text-tv-text mb-4">Your Mentions</h2>
              {mentions.length === 0 ? (
                <div className="text-center py-12">
                  <AtSign className="w-12 h-12 text-tv-text-soft mx-auto mb-3" />
                  <p className="text-tv-text-soft">No mentions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentions.map((mention) => (
                    <div key={mention.id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-tv-blue flex items-center justify-center text-white text-sm font-bold">
                          {mention.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-tv-text">@{mention.username}</p>
                          <p className="text-sm text-tv-text-soft mt-1">{mention.message}</p>
                          <p className="text-xs text-tv-text-soft mt-2">
                            {new Date(mention.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tickers' && (
            <motion.div
              key="tickers"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto p-4"
            >
              <h2 className="text-lg font-bold text-tv-text mb-4">Mentioned Tickers</h2>
              {tickers.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-tv-text-soft mx-auto mb-3" />
                  <p className="text-tv-text-soft">No tickers mentioned yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickers.map((ticker) => (
                    <div key={ticker.symbol} className="card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-tv-chip flex items-center justify-center">
                          <span className="text-sm font-bold text-tv-text">${ticker.symbol}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-tv-text">${ticker.symbol}</p>
                          <p className="text-xs text-tv-text-soft">
                            {ticker.mentions} mention{ticker.mentions !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ticker.sentiment === 'bullish'
                          ? 'bg-green-100 text-green-700'
                          : ticker.sentiment === 'bearish'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {ticker.sentiment}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'attachments' && (
            <motion.div
              key="attachments"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto p-4"
            >
              <h2 className="text-lg font-bold text-tv-text mb-4">Shared Files</h2>
              {attachments.length === 0 ? (
                <div className="text-center py-12">
                  <Paperclip className="w-12 h-12 text-tv-text-soft mx-auto mb-3" />
                  <p className="text-tv-text-soft">No files shared yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card p-3 hover:border-tv-blue transition-all group"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      ) : file.type.startsWith('video/') ? (
                        <video
                          src={file.url}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                          controls={false}
                        />
                      ) : (
                        <div className="w-full h-32 bg-tv-chip rounded-lg mb-2 flex items-center justify-center">
                          <Paperclip className="w-8 h-8 text-tv-text-soft" />
                        </div>
                      )}
                      <p className="text-xs font-medium text-tv-text truncate">{file.filename}</p>
                      <p className="text-xs text-tv-text-soft">{file.uploadedBy}</p>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
