// Push Notification Service Worker

self.addEventListener('push', function(event) {
  console.log('Push notification received:', event)

  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {
        title: 'LFG Chat',
        body: event.data.text() || 'New message',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      }
    }
  }

  const title = data.title || 'LFG Chat'
  const options = {
    body: data.body || 'New message in group chat',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'lfg-chat',
    requireInteraction: false,
    data: {
      url: data.url || '/chat',
      ...data.data
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event)

  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/chat')
  )
})

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Push subscription changed')

  event.waitUntil(
    fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: event.newSubscription
      })
    })
  )
})
