'use client'

import { useEffect, useState } from 'react'
import { Settings, Bell, HardDrive, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
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

  const percentNum = usage ? parseFloat(usage.percentUsed) : 0
  const isWarning = percentNum > 80

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-tv-bg-secondary flex items-center justify-center">
            <Settings className="w-5 h-5 text-tv-text" />
          </div>
          <h1 className="text-2xl font-bold text-tv-text">Settings</h1>
        </div>
        <p className="text-tv-text-soft text-sm ml-[52px]">
          Manage your account preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Notifications Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Bell className="w-4 h-4 text-tv-text-soft" />
            <h2 className="text-sm font-bold text-tv-text uppercase tracking-wide">Notifications</h2>
          </div>
          <div className="bg-white rounded-2xl border border-tv-border p-5">
            <PushNotificationManager />
          </div>
        </div>

        {/* Storage Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <HardDrive className="w-4 h-4 text-tv-text-soft" />
            <h2 className="text-sm font-bold text-tv-text uppercase tracking-wide">Storage</h2>
          </div>

          <div className="bg-white rounded-2xl border border-tv-border p-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-tv-blue animate-spin" />
              </div>
            ) : !usage ? (
              <div className="text-center py-8">
                <p className="text-tv-text-soft">Failed to load storage usage</p>
              </div>
            ) : (
              <>
                {/* Storage Stats */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-tv-bg-secondary rounded-xl p-4">
                    <p className="text-xs text-tv-text-muted font-medium mb-1">Files Stored</p>
                    <p className="text-2xl font-bold text-tv-text">{usage.totalFiles}</p>
                  </div>
                  <div className="bg-tv-bg-secondary rounded-xl p-4">
                    <p className="text-xs text-tv-text-muted font-medium mb-1">Storage Used</p>
                    <p className="text-2xl font-bold text-tv-text">
                      {usage.usageGB}<span className="text-sm font-normal text-tv-text-soft"> GB</span>
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-tv-text">Storage Limit</span>
                    <span className="text-sm font-semibold text-tv-text">
                      {usage.percentUsed}%
                    </span>
                  </div>
                  <div className="h-3 bg-tv-bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWarning
                          ? 'bg-gradient-to-r from-tv-orange to-tv-down'
                          : 'bg-gradient-to-r from-tv-blue to-tv-teal'
                      }`}
                      style={{ width: `${Math.min(percentNum, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-tv-text-muted">0 GB</span>
                    <span className="text-xs text-tv-text-muted">{usage.limitGB} GB</span>
                  </div>
                </div>

                {/* Warning */}
                {isWarning && (
                  <div className="mt-4 flex items-start gap-3 p-4 bg-tv-down-soft rounded-xl animate-scale-in">
                    <AlertTriangle className="w-5 h-5 text-tv-down flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-tv-down mb-1">Storage Warning</p>
                      <p className="text-xs text-tv-down/80">
                        You&apos;re approaching the free tier limit. Consider deleting old files to free up space.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* App Info Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <h2 className="text-sm font-bold text-tv-text uppercase tracking-wide">About</h2>
          </div>

          <div className="bg-white rounded-2xl border border-tv-border divide-y divide-tv-border">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-tv-text">Version</p>
                <p className="text-xs text-tv-text-muted">LFG App</p>
              </div>
              <span className="text-sm font-mono text-tv-text-soft bg-tv-bg-secondary px-2.5 py-1 rounded-lg">
                1.0.0
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-tv-text">Built with</p>
                <p className="text-xs text-tv-text-muted">Next.js, Tailwind CSS, Prisma</p>
              </div>
              <ChevronRight className="w-4 h-4 text-tv-text-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
