'use client'

import { useState, useEffect } from 'react'
import TickerChip from './TickerChip'

interface Reaction {
  id: string
  emoji: string
  userId: string
  user?: {
    username: string
  }
}

interface ReplyTo {
  id: string
  ciphertext: string
  sender: {
    username: string
  }
}

interface MessageProps {
  id: string
  username: string
  ciphertext: string
  mediaPtr?: string | null
  timestamp: string
  isOwn: boolean
  currentUserId?: string
  reactions?: Reaction[]
  replyTo?: ReplyTo
  onReply?: (message: { id: string; username: string; ciphertext: string }) => void
}

type MessagePart = { type: 'text'; content: string } | { type: 'ticker'; symbol: string } | { type: 'mention'; username: string }

export default function Message({
  id,
  username,
  ciphertext,
  mediaPtr,
  timestamp,
  isOwn,
  currentUserId,
  reactions: initialReactions = [],
  replyTo,
  onReply
}: MessageProps) {
  const [imageError, setImageError] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [reactions, setReactions] = useState<Array<{ emoji: string; count: number; userReacted: boolean }>>([])

  // Quick reaction emojis
  const quickReactions = ['👍', '❤️', '😂', '🎉', '🤔', '🙏']

  // Parse reactions
  useEffect(() => {
    if (!initialReactions || initialReactions.length === 0) {
      setReactions([])
      return
    }

    const grouped = initialReactions.reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, userReacted: false }
      }
      acc[r.emoji].count++
      if (currentUserId && r.userId === currentUserId) {
        acc[r.emoji].userReacted = true
      }
      return acc
    }, {} as Record<string, { emoji: string; count: number; userReacted: boolean }>)

    setReactions(Object.values(grouped))
  }, [initialReactions, currentUserId])

  // Handle reaction toggle
  const handleReaction = async (emoji: string) => {
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, emoji }),
      })

      if (res.ok) {
        // Optimistically update UI
        const existing = reactions.find(r => r.emoji === emoji)
        if (existing?.userReacted) {
          // Remove reaction
          setReactions(prev =>
            prev
              .map(r => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
              .filter(r => r.count > 0)
          )
        } else {
          // Add reaction
          if (existing) {
            setReactions(prev =>
              prev.map(r => (r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r))
            )
          } else {
            setReactions(prev => [...prev, { emoji, count: 1, userReacted: true }])
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }

  // Parse message text for tickers and mentions
  const parseMessage = (text: string): MessagePart[] => {
    const parts: MessagePart[] = []
    // Regex to match $TICKER (1-5 letters, case-insensitive) or @username
    const regex = /(\$[A-Za-z]{1,5})|(@\w+)/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
      }

      // Add ticker or mention
      if (match[0].startsWith('$')) {
        // Convert ticker to uppercase for consistency
        parts.push({ type: 'ticker', symbol: match[0].slice(1).toUpperCase() })
      } else if (match[0].startsWith('@')) {
        parts.push({ type: 'mention', username: match[0].slice(1) })
      }

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }

  const messageParts = parseMessage(ciphertext)

  // Determine attachment type
  const getAttachmentType = (url: string): 'image' | 'video' | 'pdf' | null => {
    if (!url) return null
    const lower = url.toLowerCase()
    if (lower.includes('.pdf')) return 'pdf'
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)/)) return 'image'
    if (lower.match(/\.(mp4|mov|avi|mpeg|webm)/)) return 'video'
    return null
  }

  const attachmentType = mediaPtr ? getAttachmentType(mediaPtr) : null

  // Format file size (estimate from URL or show generic)
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'File'
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    return `${kb.toFixed(0)} KB`
  }

  // Extract filename from URL
  const getFilename = (url: string): string => {
    try {
      const parts = url.split('/')
      const lastPart = parts[parts.length - 1]
      // Remove any query parameters
      return decodeURIComponent(lastPart.split('?')[0])
    } catch {
      return 'attachment'
    }
  }

  return (
    <div id={`message-${id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col relative`}>
        <div className="text-xs text-tv-text-soft mb-1">{username}</div>

        {/* Reaction Picker (shows on hover) */}
        <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex items-center gap-1 bg-tv-panel border border-tv-grid rounded-full px-2 py-1 shadow-lg">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="hover:scale-125 transition-transform text-lg p-1"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Reply Button (shows on hover) */}
        {onReply && (
          <button
            onClick={() => onReply({ id, username, ciphertext })}
            className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 bg-tv-panel border border-tv-grid rounded-lg px-2 py-1 text-xs text-tv-text-soft hover:text-tv-text hover:bg-tv-hover transition-all"
            type="button"
          >
            Reply
          </button>
        )}

        {/* Reply Reference (if this is a reply) */}
        {replyTo && (
          <button
            className="mb-2 flex items-center gap-2 text-xs text-tv-text-soft hover:text-tv-text transition-colors"
            type="button"
          >
            <div className="w-0.5 h-8 bg-tv-grid rounded-full" />
            <div className="text-left">
              <div className="font-medium">@{replyTo.sender.username}</div>
              <div className="truncate max-w-[200px]">{replyTo.ciphertext}</div>
            </div>
          </button>
        )}

        <div
          className={`px-4 py-2 rounded-xl ${
            isOwn ? 'bg-tv-blue text-white' : 'bg-tv-chip text-tv-text'
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap">
            {messageParts.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index}>{part.content}</span>
              } else if (part.type === 'ticker') {
                return (
                  <span key={index} className="inline-block mx-0.5">
                    <TickerChip symbol={part.symbol} />
                  </span>
                )
              } else if (part.type === 'mention') {
                return (
                  <span
                    key={index}
                    className="bg-white text-black px-1 rounded font-medium mx-0.5"
                  >
                    @{part.username}
                  </span>
                )
              }
              return null
            })}
          </p>

          {/* Image attachment */}
          {attachmentType === 'image' && !imageError && (
            <div className="mt-2">
              <img
                src={mediaPtr!}
                alt="Attachment"
                className="max-w-full max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(mediaPtr!, '_blank')}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </div>
          )}

          {/* Video attachment */}
          {attachmentType === 'video' && (
            <div className="mt-2">
              <video
                src={mediaPtr!}
                controls
                className="max-w-full max-h-[300px] rounded-lg"
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* PDF attachment */}
          {attachmentType === 'pdf' && (
            <a
              href={mediaPtr!}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 flex items-center gap-2 p-2 rounded border ${
                isOwn
                  ? 'border-white/30 hover:bg-white/10'
                  : 'border-tv-grid hover:bg-tv-bg-secondary'
              } transition-colors`}
            >
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{getFilename(mediaPtr!)}</div>
                <div className="text-[10px] opacity-75">PDF Document</div>
              </div>
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Reaction Counts (below message) */}
        {reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  r.userReacted
                    ? 'bg-tv-blue border-tv-blue text-white'
                    : 'bg-tv-bg border-tv-grid text-tv-text hover:bg-tv-hover'
                }`}
                type="button"
              >
                <span>{r.emoji}</span>
                <span className="font-medium">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="text-[10px] text-tv-text-soft mt-1">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
