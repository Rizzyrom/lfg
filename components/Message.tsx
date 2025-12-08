'use client'

import { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { Reply, Bot, FileText, Download, ExternalLink } from 'lucide-react'
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

// Parse message text for tickers and mentions
const parseMessage = (text: string): MessagePart[] => {
  const parts: MessagePart[] = []
  const regex = /(\$[A-Za-z]{1,5})|(@\w+)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[0].startsWith('$')) {
      parts.push({ type: 'ticker', symbol: match[0].slice(1).toUpperCase() })
    } else if (match[0].startsWith('@')) {
      parts.push({ type: 'mention', username: match[0].slice(1) })
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

// Determine attachment type
const getAttachmentType = (url: string): 'image' | 'video' | 'pdf' | null => {
  if (!url) return null
  const lower = url.toLowerCase()
  if (lower.includes('.pdf')) return 'pdf'
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)/)) return 'image'
  if (lower.match(/\.(mp4|mov|avi|mpeg|webm)/)) return 'video'
  return null
}

// Extract filename from URL
const getFilename = (url: string): string => {
  try {
    const parts = url.split('/')
    const lastPart = parts[parts.length - 1]
    return decodeURIComponent(lastPart.split('?')[0])
  } catch {
    return 'attachment'
  }
}

function Message({
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
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  // Quick reaction emojis
  const quickReactions = ['👍', '❤️', '😂', '🎉', '🤔', '🙏']

  // Long press handlers for mobile
  const handleTouchStart = useCallback(() => {
    const timer = setTimeout(() => {
      setShowReactionPicker(true)
    }, 500)
    setLongPressTimer(timer)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

  // Click outside handler
  useEffect(() => {
    if (!showReactionPicker) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.reaction-picker-container')) {
        setShowReactionPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as any)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [showReactionPicker])

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

  const handleReaction = useCallback(async (emoji: string) => {
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, emoji }),
      })

      if (res.ok) {
        const existing = reactions.find(r => r.emoji === emoji)
        if (existing?.userReacted) {
          setReactions(prev =>
            prev
              .map(r => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
              .filter(r => r.count > 0)
          )
        } else {
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
  }, [id, reactions])

  // Memoized values
  const messageParts = useMemo(() => parseMessage(ciphertext), [ciphertext])
  const attachmentType = useMemo(() => mediaPtr ? getAttachmentType(mediaPtr) : null, [mediaPtr])
  const filename = useMemo(() => mediaPtr ? getFilename(mediaPtr) : '', [mediaPtr])

  const handleReplyClick = useCallback(() => {
    if (onReply) {
      onReply({ id, username, ciphertext })
    }
  }, [onReply, id, username, ciphertext])

  const handleImageClick = useCallback(() => {
    if (mediaPtr) {
      window.open(mediaPtr, '_blank')
    }
  }, [mediaPtr])

  const formattedTime = useMemo(() =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [timestamp]
  )

  // Check if this is an agent message
  const isAgent = username === 'LFG Agent'

  return (
    <div
      id={`message-${id}`}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group animate-fade-in-up`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      <div className={`max-w-[75%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col relative`}>
        {/* Username header */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          {isAgent && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-tv-blue to-tv-purple flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
          )}
          <span className="text-xs font-semibold text-tv-text-soft">{username}</span>
          {isAgent && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-tv-blue text-white">
              AI
            </span>
          )}
        </div>

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div className="reaction-picker-container absolute -top-14 left-0 right-0 z-20 flex flex-col gap-2 animate-scale-in">
            {onReply && (
              <button
                onClick={() => {
                  handleReplyClick()
                  setShowReactionPicker(false)
                }}
                className="self-start flex items-center gap-2 bg-white border border-tv-border rounded-xl px-4 py-2.5 text-sm font-semibold text-tv-text hover:bg-tv-bg-secondary active:scale-95 transition-all shadow-elevation-3"
                type="button"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}

            <div className="flex items-center gap-0.5 bg-white border border-tv-border rounded-full px-3 py-2 shadow-elevation-3">
              {quickReactions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReaction(emoji)
                    setShowReactionPicker(false)
                  }}
                  className="hover:scale-125 active:scale-95 transition-transform text-xl p-2 min-h-[44px] min-w-[44px] touch-manipulation rounded-full hover:bg-tv-bg-secondary"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply Reference */}
        {replyTo && (
          <button
            className="mb-2 ml-1 flex items-center gap-2 text-xs text-tv-text-soft hover:text-tv-text transition-colors group/reply"
            type="button"
          >
            <div className="w-0.5 h-10 bg-tv-border group-hover/reply:bg-tv-blue rounded-full transition-colors" />
            <div className="text-left bg-tv-bg-secondary rounded-lg px-3 py-2">
              <div className="font-semibold text-tv-text-soft">@{replyTo.sender.username}</div>
              <div className="truncate max-w-[200px] text-tv-text-muted">{replyTo.ciphertext}</div>
            </div>
          </button>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all ${
            isAgent
              ? 'bg-gradient-to-br from-tv-blue via-tv-blue to-tv-blue-hover text-white shadow-md shadow-tv-blue/20'
              : isOwn
              ? 'bg-tv-text text-white rounded-br-md'
              : 'bg-white border border-tv-border text-tv-text rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {messageParts.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index}>{part.content}</span>
              } else if (part.type === 'ticker') {
                return (
                  <span key={index} className="inline-block mx-0.5 align-middle">
                    <TickerChip symbol={part.symbol} />
                  </span>
                )
              } else if (part.type === 'mention') {
                return (
                  <span
                    key={index}
                    className={`px-1.5 py-0.5 rounded-md font-semibold mx-0.5 ${
                      isOwn || isAgent
                        ? 'bg-white/20 text-white'
                        : 'bg-tv-blue-soft text-tv-blue'
                    }`}
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
            <div className="mt-3 -mx-1">
              <img
                src={mediaPtr!}
                alt="Attachment"
                className="w-full max-h-[300px] object-cover rounded-xl cursor-pointer hover:opacity-95 active:opacity-90 transition-opacity"
                onClick={handleImageClick}
                onError={() => setImageError(true)}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Video attachment */}
          {attachmentType === 'video' && (
            <div className="mt-3 -mx-1">
              <video
                src={mediaPtr!}
                controls
                className="w-full max-h-[300px] rounded-xl"
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
              className={`mt-3 flex items-center gap-3 p-3 rounded-xl transition-all ${
                isOwn || isAgent
                  ? 'bg-white/10 hover:bg-white/20'
                  : 'bg-tv-bg-secondary hover:bg-tv-chip'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isOwn || isAgent ? 'bg-white/20' : 'bg-tv-down-soft'
              }`}>
                <FileText className={`w-5 h-5 ${isOwn || isAgent ? 'text-white' : 'text-tv-down'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{filename}</div>
                <div className="text-xs opacity-70">PDF Document</div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-60" />
            </a>
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap px-1">
            {reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all touch-manipulation active:scale-95 ${
                  r.userReacted
                    ? 'bg-tv-blue border-tv-blue text-white shadow-sm shadow-tv-blue/20'
                    : 'bg-white border-tv-border text-tv-text hover:border-tv-blue hover:bg-tv-blue-soft'
                }`}
                type="button"
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[11px] text-tv-text-muted mt-1.5 px-1 font-medium">
          {formattedTime}
        </div>
      </div>
    </div>
  )
}

export default memo(Message, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.username === nextProps.username &&
    prevProps.ciphertext === nextProps.ciphertext &&
    prevProps.mediaPtr === nextProps.mediaPtr &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.currentUserId === nextProps.currentUserId &&
    JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions) &&
    JSON.stringify(prevProps.replyTo) === JSON.stringify(nextProps.replyTo)
  )
})
