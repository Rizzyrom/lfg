'use client'

import { useState } from 'react'

export default function RightRail() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')

  const handlePulse = async () => {
    setLoading(true)
    try {
      const headlines = [
        'Bitcoin reaches new all-time high',
        'Tech stocks rally on AI optimism',
        'Federal Reserve holds rates steady',
      ]

      const res = await fetch('/api/pulse/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headlines }),
      })

      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Pulse failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-tv-text">AI Pulse</h2>
          <button onClick={handlePulse} disabled={loading} className="btn btn-primary text-xs">
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>
        {summary ? (
          <p className="text-sm text-tv-text-soft leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-tv-text-soft italic">
            Click Generate to get an AI summary of public market headlines
          </p>
        )}
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-semibold text-tv-text mb-4">Chat Preview</h2>
        <p className="text-sm text-tv-text-soft">
          Join the chat to see real-time messages
        </p>
      </div>
    </div>
  )
}
