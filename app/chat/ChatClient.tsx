'use client'

import { useState, useEffect, useRef } from 'react'
import Message from '@/components/Message'

interface ChatMessage {
  id: string
  senderId: string
  username: string
  ciphertext: string
  createdAt: string
}

interface ChatClientProps {
  username: string
}

export default function ChatClient({ username }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch messages initially and every 3 seconds
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      if (res.ok) {
        setInput('')
        await fetchMessages() // Refresh messages immediately
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
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

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
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
                  username={msg.username}
                  ciphertext={msg.ciphertext}
                  timestamp={msg.createdAt}
                  isOwn={msg.username === username}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-tv-grid">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="input flex-1 text-sm sm:text-base"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn btn-primary px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
