'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, CheckCircle2 } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  if (typeof window === 'undefined') return new Uint8Array()

  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if (typeof window === 'undefined') return
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
    }
  }

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        await subscribeToPush()
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      alert('Failed to request notification permission')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported')
      return
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID public key not configured')
      alert('Push notifications not configured on server')
      return
    }

    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js')
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      })

      if (response.ok) {
        setSubscribed(true)
      } else {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
      alert('Failed to enable push notifications')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    if (typeof window === 'undefined') return
    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })
      }

      setSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('Failed to disable push notifications')
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything during SSR
  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tv-bg-secondary flex items-center justify-center">
            <Bell className="w-5 h-5 text-tv-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-tv-text">Push Notifications</p>
            <p className="text-xs text-tv-text-muted">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Browser doesn't support notifications
  if (typeof window !== 'undefined' && !('Notification' in window)) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tv-bg-secondary flex items-center justify-center">
            <BellOff className="w-5 h-5 text-tv-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-tv-text">Push Notifications</p>
            <p className="text-xs text-tv-text-muted">Not supported in this browser</p>
          </div>
        </div>
      </div>
    )
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tv-down-soft flex items-center justify-center">
            <BellOff className="w-5 h-5 text-tv-down" />
          </div>
          <div>
            <p className="text-sm font-semibold text-tv-text">Push Notifications</p>
            <p className="text-xs text-tv-down">Blocked - enable in browser settings</p>
          </div>
        </div>
      </div>
    )
  }

  // Subscribed
  if (subscribed) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tv-up-soft flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-tv-up" />
          </div>
          <div>
            <p className="text-sm font-semibold text-tv-text">Push Notifications</p>
            <p className="text-xs text-tv-up">Enabled</p>
          </div>
        </div>
        <button
          onClick={unsubscribeFromPush}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-tv-bg-secondary hover:bg-tv-down-soft text-tv-text-soft hover:text-tv-down text-sm font-semibold transition-all disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Disable'
          )}
        </button>
      </div>
    )
  }

  // Not subscribed - show enable button
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-tv-bg-secondary flex items-center justify-center">
          <Bell className="w-5 h-5 text-tv-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold text-tv-text">Push Notifications</p>
          <p className="text-xs text-tv-text-muted">Get notified of new messages</p>
        </div>
      </div>
      <button
        onClick={requestPermission}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-tv-blue hover:bg-tv-blue-hover text-white text-sm font-semibold transition-all disabled:opacity-50 active:scale-95"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Enable'
        )}
      </button>
    </div>
  )
}
