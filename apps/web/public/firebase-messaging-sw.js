importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// These will be replaced by the FCM registration component at runtime
// via the service worker query string: ?config=<base64 encoded config>
const configParam = new URL(location.href).searchParams.get('config')
const firebaseConfig = configParam ? JSON.parse(atob(configParam)) : {}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {}
  if (!title) return
  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/icons/icon-192x192.png',
    data: payload.data,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link
  if (link) {
    event.waitUntil(clients.openWindow(link))
  }
})
