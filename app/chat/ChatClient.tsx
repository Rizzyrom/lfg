'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Message from '@/components/Message'
import MentionAutocomplete from '@/components/MentionAutocomplete'
import Toast from '@/components/Toast'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { useDataPrefetch } from '@/components/DataPrefetchProvider'
import { Paperclip, X, FileIcon, Send, MessageCircle, DollarSign } from 'lucide-react'

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
  isActive?: boolean
}

export default function ChatClient({ username, userId, isActive = true }: ChatClientProps) {
  const { getCachedData, setCachedData } = useDataPrefetch()

  // Initialize with cached data for instant display
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = getCachedData('chat')
    return cached || []
  })
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
        const freshMessages = data.messages || []
        setMessages(freshMessages)
        // Update cache with fresh data
        setCachedData('chat', freshMessages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setToast({ message: 'Failed to fetch messages', type: 'error' })
    }
  }, [setCachedData])

  useEffect(() => {
    // Only fetch messages when component is active
    if (!isActive) return

    fetchMessages()
    // Optimized: Increased polling interval to 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages, isActive])

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
    console.log('[CHAT DEBUG] handleSend called, input:', input)
    if ((!input.trim() && !selectedFile) || sending) {
      console.log('[CHAT DEBUG] Send blocked - empty input or already sending')
      return
    }

    console.log('[CHAT DEBUG] Sending message:', input)
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

      console.log('[CHAT DEBUG] Making POST request to /api/chat')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim() || '📎 Attachment',
          mediaPtr: mediaUrl,
          replyToId: replyingTo?.id || null
        }),
      })

      console.log('[CHAT DEBUG] POST response status:', res.status)
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

  // Memoize setReplyingTo callback
  const handleReplyClick = useCallback((message: { id: string; username: string; ciphertext: string }) => {
    setReplyingTo(message)
  }, [])

  // Memoize toast close handler
  const handleToastClose = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <div className="flex flex-col h-full bg-tv-bg overflow-x-hidden">
      {/* Messages Area - Takes full height - NO HORIZONTAL SCROLL */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-0 space-y-2 smooth-scroll max-w-full px-3"
        style={{ paddingBottom: '85px', WebkitOverflowScrolling: 'touch' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6 py-12 rounded-2xl bg-gradient-to-b from-tv-panel to-transparent">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-tv-blue/20 to-tv-blue/5 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-tv-blue" />
              </div>
              <p className="text-tv-text text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-tv-text-soft text-sm">Start the conversation!</p>
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

      {/* New messages indicator - Fixed positioning with modern floating button */}
      {showNewMessages && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <button
            onClick={() => scrollToBottom()}
            className="bg-gradient-to-r from-tv-blue to-tv-blue-hover text-white px-6 py-3 rounded-full shadow-lg shadow-tv-blue/30 hover:shadow-tv-blue/50 transition-all duration-300 font-semibold pointer-events-auto hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>New messages</span>
            <span className="text-sm">↓</span>
          </button>
        </div>
      )}

      {/* Reply Banner - Fixed above input with modern design */}
      {replyingTo && (
        <div className="fixed left-0 right-0 bg-gradient-to-r from-tv-panel to-tv-panel/95 border-t border-tv-grid/30 backdrop-blur-md px-4 py-3 flex items-center justify-between z-40 animate-slide-in shadow-lg" style={{ bottom: 'calc(5px + 65px)' }}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-1 h-12 bg-gradient-to-b from-tv-blue to-tv-blue/50 rounded-full flex-shrink-0 shadow-glow-blue" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-tv-blue font-semibold mb-1">Replying to @{replyingTo.username}</div>
              <div className="text-sm text-tv-text-soft truncate">
                {replyingTo.ciphertext}
              </div>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-2 hover:bg-tv-hover/50 rounded-full transition-all duration-200 flex-shrink-0 active:scale-90"
            type="button"
          >
            <X className="w-5 h-5 text-tv-text-muted" />
          </button>
        </div>
      )}

      {/* File Preview Panel - Fixed above input with modern card design */}
      {selectedFile && (
        <div className="fixed left-0 right-0 bg-gradient-to-b from-tv-panel/98 to-tv-panel backdrop-blur-lg border-t border-tv-grid/30 p-4 animate-slide-in z-40 shadow-xl" style={{ bottom: 'calc(5px + 65px)' }}>
          <div className="flex items-center gap-3 bg-tv-bg/50 backdrop-blur-sm border border-tv-grid/50 rounded-2xl p-4 shadow-md">
            {selectedFile.type.startsWith('image/') && filePreview && (
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm bg-tv-grid flex-shrink-0">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {selectedFile.type.startsWith('video/') && filePreview && (
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm bg-tv-grid flex-shrink-0">
                <video
                  src={filePreview}
                  className="w-full h-full object-cover"
                  muted
                />
              </div>
            )}

            {selectedFile.type === 'application/pdf' && (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-tv-blue/10 to-tv-blue/5 flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-10 h-10 text-tv-blue" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-tv-text truncate mb-1">{selectedFile.name}</div>
              <div className="text-xs text-tv-text-soft font-medium">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              {uploading && (
                <div className="mt-2.5">
                  <div className="w-full bg-tv-grid/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-tv-up to-tv-up/80 h-2 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-tv-text-soft mt-1 font-medium">{uploadProgress}%</div>
                </div>
              )}
            </div>

            <button
              onClick={handleCancelUpload}
              className="p-2.5 hover:bg-tv-hover/50 rounded-full transition-all duration-200 flex-shrink-0 active:scale-90"
              disabled={uploading}
            >
              <X className="w-5 h-5 text-tv-text-muted" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom with modern iOS-style design */}
      <form
        onSubmit={handleSend}
        className="fixed left-0 right-0 bg-gradient-to-t from-tv-panel via-tv-panel to-tv-panel/95 backdrop-blur-lg border-t border-tv-grid/20 z-40 shadow-2xl"
        style={{ bottom: '5px' }}
      >
        <div className="flex items-center gap-2 px-3 py-3">
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
            className="p-2.5 rounded-full hover:bg-tv-hover/50 transition-all duration-200 flex-shrink-0 active:scale-90"
            disabled={uploading}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-tv-text-soft" />
          </button>

          <button
            type="button"
            onClick={() => {
              setInput(prev => prev + '$')
              inputRef.current?.focus()
            }}
            className="p-2.5 rounded-full hover:bg-tv-hover/50 transition-all duration-200 flex-shrink-0 active:scale-90"
            disabled={sending || uploading}
            aria-label="Insert ticker symbol"
            title="Insert $ for ticker"
          >
            <DollarSign className="w-5 h-5 text-tv-green" />
          </button>

          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={`Message @${username}`}
              className="w-full bg-tv-bg/50 backdrop-blur-sm text-tv-text placeholder-tv-text-muted rounded-full px-5 py-2.5 border border-tv-grid/40 focus:outline-none focus:ring-2 focus:ring-tv-blue/30 focus:border-tv-blue/50 transition-all duration-200 shadow-sm"
              disabled={sending || uploading}
              style={{ fontSize: '16px' }}
            />
          </div>

          <button
            type="submit"
            disabled={(!input.trim() && !selectedFile) || sending || uploading}
            className="p-3 bg-gradient-to-br from-tv-blue to-tv-blue-hover hover:from-tv-blue-hover hover:to-tv-blue disabled:from-tv-text-muted disabled:to-tv-text-muted disabled:cursor-not-allowed rounded-full transition-all duration-200 shadow-lg shadow-tv-blue/20 hover:shadow-tv-blue/40 flex-shrink-0 active:scale-90 disabled:shadow-none"
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
