'use client'

import { useState, useEffect, useRef } from 'react'
import Message from '@/components/Message'
import MentionAutocomplete from '@/components/MentionAutocomplete'
import Toast from '@/components/Toast'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { Paperclip, X, FileIcon } from 'lucide-react'

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

  useEffect(() => {
    // Fetch messages initially and every 3 seconds
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll when messages change
  autoScrollOnNewContent([messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Handle input changes and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0
    setInput(value)

    // Detect @ mention
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Check if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt)
        setMentionStartPos(lastAtIndex)
        setShowMentions(true)

        // Calculate dropdown position
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setMentionPosition({
            top: rect.top - 210, // Position above input
            left: rect.left + 10,
          })
        }
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Handle mention selection
  const handleMentionSelect = (username: string) => {
    const before = input.slice(0, mentionStartPos)
    const after = input.slice(mentionStartPos + mentionQuery.length + 1)
    setInput(`${before}@${username} ${after}`)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File size must be under 5MB', type: 'error' })
      return
    }

    setSelectedFile(file)

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  // Cancel file upload
  const handleCancelUpload = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedFile) || sending) return

    setSending(true)
    let mediaUrl: string | null = null

    try {
      // Upload file first if attached
      if (selectedFile) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json()
          throw new Error(uploadData.error || 'Upload failed')
        }

        const uploadData = await uploadRes.json()
        mediaUrl = uploadData.url

        // Clear file state
        handleCancelUpload()
      }

      // Send message with optional attachment and reply
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
        setInput('')
        setShowMentions(false)
        setReplyingTo(null)
        await fetchMessages() // Refresh messages immediately
      } else {
        const data = await res.json()
        setToast({ message: data.error || 'Failed to send message', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setToast({
        message: error instanceof Error ? error.message : 'Failed to send message',
        type: 'error'
      })
      handleCancelUpload()
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  // Handle mobile keyboard behavior
  const handleInputFocus = () => {
    if (window.innerWidth < 768) {
      // Small delay to ensure keyboard is visible
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 300)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-tv-text">Group Chat</h1>
        <p className="text-xs sm:text-sm text-tv-text-soft mt-1">
          <span className="text-tv-up">● Live</span> - Updates every 3 seconds
        </p>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-tv-text-soft text-center">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
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
                  onReply={setReplyingTo}
                />
              ))}
            </>
          )}
        </div>

        {/* New messages indicator */}
        {showNewMessages && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-tv-blue text-white px-4 py-2 rounded-full shadow-lg hover:bg-opacity-90 transition-all text-sm font-medium"
          >
            New messages ↓
          </button>
        )}

        {/* Reply Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-tv-panel border-t border-tv-grid px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-tv-blue rounded-full" />
              <div>
                <div className="text-xs text-tv-text-soft">Replying to @{replyingTo.username}</div>
                <div className="text-sm text-tv-text truncate max-w-[300px]">
                  {replyingTo.ciphertext}
                </div>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-tv-hover rounded transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-tv-text-soft" />
            </button>
          </div>
        )}

        {/* File Preview Panel */}
        {selectedFile && (
          <div className="border-t border-tv-grid bg-tv-panel p-3 sm:p-4">
            <div className="flex items-center gap-3 bg-tv-bg border border-tv-grid rounded-lg p-3">
              {/* Image Preview */}
              {selectedFile.type.startsWith('image/') && filePreview && (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded"
                />
              )}

              {/* PDF Icon */}
              {selectedFile.type === 'application/pdf' && (
                <FileIcon className="w-16 h-16 text-tv-text-soft" />
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tv-text truncate">{selectedFile.name}</div>
                <div className="text-xs text-tv-text-soft">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="flex-1">
                  <div className="h-2 bg-tv-grid rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tv-blue transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-tv-text-soft mt-1 text-center">
                    {uploadProgress}%
                  </div>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={handleCancelUpload}
                className="p-2 hover:bg-tv-hover rounded-lg transition-colors"
                type="button"
              >
                <X className="w-4 h-4 text-tv-text-soft" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-tv-grid">
          <div className="flex items-center gap-2 relative">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Paperclip Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-tv-hover transition-colors"
              disabled={uploading}
            >
              <Paperclip className="w-5 h-5 text-tv-text-soft" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Type a message... (use @ to mention)"
              className="input flex-1 text-sm sm:text-base"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || (!input.trim() && !selectedFile) || uploading}
              className="btn btn-primary px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>

            {/* Mention Autocomplete */}
            {showMentions && (
              <MentionAutocomplete
                query={mentionQuery}
                onSelect={handleMentionSelect}
                onClose={() => setShowMentions(false)}
                position={mentionPosition}
              />
            )}
          </div>
        </form>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
