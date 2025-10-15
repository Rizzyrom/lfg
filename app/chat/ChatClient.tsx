'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Message from '@/components/Message'
import MentionAutocomplete from '@/components/MentionAutocomplete'
import Toast from '@/components/Toast'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { Paperclip, X, FileIcon, Send, Menu, Home, TrendingUp, MessageCircle, LogOut } from 'lucide-react'

interface Reaction {
  id: string
  emoji: string
  userId: string
  user?: {
    id: string
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

interface ChatMessage {
  id: string
  senderId: string
  username: string
  ciphertext: string
  mediaPtr?: string | null
  createdAt: string
  reactions?: Reaction[]
  replyTo?: ReplyTo
}

interface ChatClientProps {
  username: string
  userId?: string
}

export default function ChatClient({ username, userId }: ChatClientProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; ciphertext: string } | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState(0)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })

  // Use auto-scroll hook
  const { scrollRef, showNewMessages, scrollToBottom, handleScroll, autoScrollOnNewContent } = useAutoScroll()

  // Memoize fetchMessages to prevent recreating on every render
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setToast({ message: 'Failed to fetch messages', type: 'error' })
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  autoScrollOnNewContent([messages])

  // Memoize handleInputChange
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0
    setInput(value)

    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt)
        setMentionStartPos(lastAtIndex)
        setShowMentions(true)

        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setMentionPosition({
            top: rect.bottom + 8, // Position below the input
            left: rect.left + 10,
          })
        }
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }, [])

  // Memoize handleMentionSelect
  const handleMentionSelect = useCallback((username: string) => {
    const before = input.slice(0, mentionStartPos)
    const after = input.slice(mentionStartPos + mentionQuery.length + 1)
    setInput(`${before}@${username} ${after}`)
    setShowMentions(false)
    inputRef.current?.focus()
  }, [input, mentionStartPos, mentionQuery])

  // Helper function to compress images
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      // Don't compress if file is already small (< 2MB)
      if (file.size < 2 * 1024 * 1024) {
        resolve(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          // Scale down large images
          let width = img.width
          let height = img.height
          const maxDimension = 1920

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.85
          )
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Memoize handleFileSelect
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      setToast({ message: 'File size must be under 50MB', type: 'error' })
      return
    }

    // Compress image if it's an image file
    let processedFile = file
    if (file.type.startsWith('image/') && !file.type.includes('gif')) {
      setToast({ message: 'Compressing image...', type: 'info' })
      processedFile = await compressImage(file)
      const savedSize = file.size - processedFile.size
      if (savedSize > 0) {
        setToast({
          message: `Image compressed: saved ${(savedSize / 1024 / 1024).toFixed(1)}MB`,
          type: 'success'
        })
      }
    }

    setSelectedFile(processedFile)

    if (processedFile.type.startsWith('image/') || processedFile.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(processedFile)
    } else {
      setFilePreview(null)
    }
  }, [compressImage])

  // Memoize handleCancelUpload
  const handleCancelUpload = useCallback(() => {
    setSelectedFile(null)
    setFilePreview(null)
    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Memoize handleSend
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedFile) || sending) return

    setSending(true)
    let mediaUrl: string | null = null

    try {
      if (selectedFile) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        // Create an AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          clearInterval(progressInterval)
          setUploadProgress(100)

          if (!uploadRes.ok) {
            const uploadData = await uploadRes.json()
            throw new Error(uploadData.error || 'Upload failed')
          }

          const uploadData = await uploadRes.json()
          mediaUrl = uploadData.url
          handleCancelUpload()
        } catch (uploadError: any) {
          clearTimeout(timeoutId)
          clearInterval(progressInterval)
          if (uploadError.name === 'AbortError') {
            throw new Error('Upload timed out. Try a smaller file or check your connection.')
          }
          throw uploadError
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim() || '📎 Attachment',
          mediaPtr: mediaUrl,
          replyToId: replyingTo?.id || null
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setInput('')
        setShowMentions(false)
        setReplyingTo(null)

        // If there's an agent message, show a toast
        if (data.agentMessage) {
          setToast({ message: 'LFG Agent is responding...', type: 'info' })
        }

        await fetchMessages()
      } else {
        const data = await res.json()
        setToast({ message: data.error || 'Failed to send', type: 'error' })
      }
    } catch (error: any) {
      console.error('Send error:', error)
      const errorMessage = error?.message || String(error)
      setToast({
        message: errorMessage.includes('Error:') ? errorMessage : `Error: ${errorMessage}`,
        type: 'error'
      })
      handleCancelUpload()
    } finally {
      setSending(false)
      setUploading(false)
    }
  }, [input, selectedFile, sending, replyingTo, handleCancelUpload, fetchMessages])

  // Memoize handleLogout
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  // Memoize setReplyingTo callback
  const handleReplyClick = useCallback((message: { id: string; username: string; ciphertext: string }) => {
    setReplyingTo(message)
  }, [])

  // Memoize toast close handler
  const handleToastClose = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <div className="flex flex-col chat-container bg-tv-bg overflow-x-hidden">
      {/* Top Navigation Bar - Minimal style */}
      <header className="flex-shrink-0 h-16 bg-tv-panel border-b border-tv-grid flex items-center justify-between px-4 elevation-1 z-20">
        <div className="flex items-center gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tv-blue flex items-center justify-center">
              <span className="text-white font-bold text-lg">LFG</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-tv-text">Group Chat</h1>
              <p className="text-xs text-tv-text-soft">
                {messages.length} messages
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Always visible, no menu */}
        <nav className="flex items-center gap-2">
          <Link
            href="/feed"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-tv-hover text-tv-text-soft hover:text-tv-text transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Feed</span>
          </Link>
          <Link
            href="/watchlist"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-tv-hover text-tv-text-soft hover:text-tv-text transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Watchlist</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-tv-down hover:text-tv-down-hover transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Logout</span>
          </button>
        </nav>
      </header>

      {/* Messages Area - Takes full remaining height - NO HORIZONTAL SCROLL */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-2 smooth-scroll max-w-full"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-tv-text-muted mx-auto mb-4" />
              <p className="text-tv-text-soft text-lg font-medium">No messages yet</p>
              <p className="text-tv-text-muted text-sm mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              id={msg.id}
              username={msg.username}
              ciphertext={msg.ciphertext}
              mediaPtr={msg.mediaPtr}
              timestamp={msg.createdAt}
              isOwn={msg.username === username}
              currentUserId={msg.senderId === userId ? userId : undefined}
              reactions={msg.reactions}
              replyTo={msg.replyTo}
              onReply={handleReplyClick}
            />
          ))
        )}
      </div>

      {/* New messages indicator - Fixed positioning */}
      {showNewMessages && (
        <div className="flex-shrink-0 flex items-center justify-center py-2 px-4 pointer-events-none">
          <button
            onClick={() => scrollToBottom()}
            className="bg-tv-blue text-white px-6 py-3 rounded-full elevation-2 hover:bg-tv-blue-hover transition-all font-medium pointer-events-auto hover-scale"
          >
            New messages ↓
          </button>
        </div>
      )}

      {/* Reply Banner - Fixed in flow */}
      {replyingTo && (
        <div className="flex-shrink-0 bg-tv-panel border-t border-tv-grid px-4 py-3 flex items-center justify-between animate-slide-in">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-1 h-10 bg-tv-blue rounded-full flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-tv-text-soft font-medium">Replying to @{replyingTo.username}</div>
              <div className="text-sm text-tv-text truncate">
                {replyingTo.ciphertext}
              </div>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-2 hover:bg-tv-hover rounded-lg transition-all flex-shrink-0 active:scale-95"
            type="button"
          >
            <X className="w-5 h-5 text-tv-text-soft" />
          </button>
        </div>
      )}

      {/* File Preview Panel - Fixed in flow */}
      {selectedFile && (
        <div className="flex-shrink-0 bg-tv-panel border-t border-tv-grid p-4 animate-slide-in">
          <div className="flex items-center gap-3 bg-tv-bg border border-tv-grid rounded-lg p-3 elevation-1">
            {selectedFile.type.startsWith('image/') && filePreview && (
              <img
                src={filePreview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded"
              />
            )}

            {selectedFile.type.startsWith('video/') && filePreview && (
              <video
                src={filePreview}
                className="w-16 h-16 object-cover rounded"
                muted
              />
            )}

            {selectedFile.type === 'application/pdf' && (
              <FileIcon className="w-16 h-16 text-gray-400" />
            )}

            <div className="flex-1 min-w-0">
              <div className="text-sm text-tv-text truncate">{selectedFile.name}</div>
              <div className="text-xs text-tv-text-soft">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              {uploading && (
                <div className="mt-2">
                  <div className="w-full bg-tv-grid rounded-full h-1.5">
                    <div
                      className="bg-tv-up h-1.5 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCancelUpload}
              className="p-2 hover:bg-tv-hover rounded-lg transition-all flex-shrink-0 active:scale-95"
              disabled={uploading}
            >
              <X className="w-5 h-5 text-tv-text-soft" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom with iOS safe area */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 bg-tv-panel border-t border-tv-grid safe-area-pb"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-lg hover:bg-tv-hover transition-all flex-shrink-0 active:scale-95 hover-opacity"
            disabled={uploading}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-tv-text-soft" />
          </button>

          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={`Message @${username}`}
              className="w-full bg-tv-bg text-tv-text placeholder-tv-text-muted rounded-lg px-4 py-3 border border-tv-grid focus:outline-none focus:ring-2 focus:ring-tv-blue focus:border-tv-blue transition-all"
              disabled={sending || uploading}
              style={{ fontSize: '16px' }}
            />
          </div>

          <button
            type="submit"
            disabled={(!input.trim() && !selectedFile) || sending || uploading}
            className="p-3 bg-tv-blue hover:bg-tv-blue-hover disabled:bg-tv-text-muted disabled:cursor-not-allowed rounded-lg transition-all elevation-2 flex-shrink-0 active:scale-95"
            aria-label="Send message"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </form>

      {/* Mention Autocomplete */}
      {showMentions && (
        <MentionAutocomplete
          query={mentionQuery}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentions(false)}
          position={mentionPosition}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleToastClose}
        />
      )}
    </div>
  )
}
