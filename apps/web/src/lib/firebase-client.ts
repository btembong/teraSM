'use client'

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
}

export async function registerFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const app       = getFirebaseApp()
    const messaging: Messaging = getMessaging(app)

    // Build the service worker URL with base64-encoded config
    const configB64 = btoa(JSON.stringify(firebaseConfig))
    const swReg = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?config=${configB64}`,
      { scope: '/' }
    )

    const token = await getToken(messaging, {
      vapidKey:            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })

    return token ?? null
  } catch {
    return null
  }
}
