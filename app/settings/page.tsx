'use client'

import { useEffect, useState } from 'react'
import PushNotificationManager from '@/components/PushNotificationManager'

interface UsageData {
  totalFiles: number
  totalSize: number
  usageGB: string
  limitGB: number
  percentUsed: string
}

export default function SettingsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/storage/usage')
      .then(r => r.json())
      .then(data => {
        setUsage(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-tv-text">Loading...</div>
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-tv-text">Failed to load storage usage</div>
      </div>
    )
  }

  const percentNum = parseFloat(usage.percentUsed)
  const isWarning = percentNum > 80

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-tv-text mb-6">Settings</h1>

      {/* Push Notifications */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-tv-text mb-3">Notifications</h2>
        <PushNotificationManager />
      </div>

      <h2 className="text-lg font-semibold text-tv-text mb-3">Storage Usage</h2>

      <div className="bg-tv-panel border border-tv-grid rounded-lg p-6">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-tv-text-soft">Files Stored</span>
            <span className="text-tv-text font-medium">{usage.totalFiles}</span>
          </div>

          <div className="flex justify-between text-sm mb-2">
            <span className="text-tv-text-soft">Storage Used</span>
            <span className="text-tv-text font-medium">
              {usage.usageGB} GB / {usage.limitGB} GB
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-tv-bg rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isWarning ? 'bg-tv-down' : 'bg-tv-up'
            }`}
            style={{ width: `${Math.min(percentNum, 100)}%` }}
          />
        </div>

        <div className="text-xs text-tv-text-soft mt-2 text-right">
          {usage.percentUsed}% used
        </div>

        {isWarning && (
          <div className="mt-4 p-3 bg-tv-down bg-opacity-10 border border-tv-down rounded-lg">
            <p className="text-sm text-tv-down">
              ⚠️ Warning: You&apos;re approaching the free tier limit. Consider deleting old files.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
