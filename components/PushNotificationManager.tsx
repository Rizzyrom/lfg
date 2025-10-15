'use client'

import { useEffect, useState } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
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
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
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
    if (!('Notification' in window)) {
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
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js')
      await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      })

      if (response.ok) {
        setSubscribed(true)
        alert('Push notifications enabled!')
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
      alert('Push notifications disabled')
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('Failed to disable push notifications')
    } finally {
      setLoading(false)
    }
  }

  if (!('Notification' in window)) {
    return null
  }

  if (permission === 'denied') {
    return (
      <div className="card p-4">
        <p className="text-sm text-tv-text-soft">
          Notifications blocked. Please enable them in your browser settings.
        </p>
      </div>
    )
  }

  if (subscribed) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-tv-up rounded-full"></div>
            <span className="text-sm font-medium text-tv-text">Notifications Enabled</span>
          </div>
          <button
            onClick={unsubscribeFromPush}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-tv-down text-sm font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Disabling...' : 'Disable'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-tv-text mb-1">Push Notifications</h3>
        <p className="text-sm text-tv-text-soft">
          Get notified when new messages are sent to the chat
        </p>
      </div>
      <button
        onClick={requestPermission}
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-tv-blue hover:bg-tv-blue-hover text-white font-medium transition-all disabled:opacity-50"
      >
        {loading ? 'Enabling...' : 'Enable Notifications'}
      </button>
    </div>
  )
}
