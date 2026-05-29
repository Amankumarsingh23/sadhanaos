// SadhanaOS Service Worker — push notifications

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e  => e.waitUntil(clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return
  const d = event.data.json()
  event.waitUntil(
    self.registration.showNotification(d.title ?? 'SadhanaOS', {
      body:    d.body  ?? 'Your sadhana awaits.',
      icon:    '/icons/icon.svg',
      badge:   '/icons/icon.svg',
      tag:     d.tag   ?? 'sadhanaos',
      data:    { url: d.url ?? '/dashboard' },
      vibrate: [150, 80, 150],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
      const existing = ws.find(w => w.url.includes(self.location.origin))
      if (existing) { existing.focus(); return existing.navigate(url) }
      return clients.openWindow(url)
    })
  )
})
