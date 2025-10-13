'use client'

import { useState, useEffect, useRef } from 'react'
import Message from '@/components/Message'

interface ChatMessage {
  messageId: string
  senderId: string
  username: string
  ciphertext: string
  ts: number
}

interface ChatClientProps {
  username: string
}

export default function ChatClient({ username }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // For MVP: WebSocket connection would be implemented here
    // This is a placeholder showing the UI structure

    // Example WebSocket connection (not functional without ws-server running):
    // const ws = new WebSocket(`ws://localhost:3001?session=${sessionId}&groupId=${groupId}`)
    // ws.onopen = () => setConnected(true)
    // ws.onmessage = (event) => {
    //   const msg = JSON.parse(event.data)
    //   setMessages(prev => [...prev, msg])
    // }
    // wsRef.current = ws

    return () => {
      wsRef.current?.close()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !connected) return

    // In production, encrypt message using lib/crypto.ts before sending
    const message = {
      ciphertext: input, // Should be encrypted
      ts: Date.now(),
    }

    wsRef.current?.send(JSON.stringify(message))
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-tv-text">Group Chat</h1>
        <p className="text-sm text-tv-text-soft mt-1">
          {connected ? (
            <span className="text-tv-up">● Connected</span>
          ) : (
            <span className="text-tv-text-soft">○ Disconnected (WebSocket server required)</span>
          )}
        </p>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-tv-text-soft text-center">
                No messages yet. Start the conversation!
                <br />
                <span className="text-xs mt-2 block">
                  Note: WebSocket server must be running for real-time chat
                </span>
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <Message
                  key={msg.messageId}
                  username={msg.username}
                  ciphertext={msg.ciphertext}
                  timestamp={new Date(msg.ts).toISOString()}
                  isOwn={msg.username === username}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-tv-grid">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={connected ? 'Type a message...' : 'Connect to send messages'}
              className="input flex-1"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!connected || !input.trim()}
              className="btn btn-primary px-6"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-tv-text-soft mt-2">
            Messages are E2EE-ready (client-side encryption placeholder)
          </p>
        </form>
      </div>
    </div>
  )
}
