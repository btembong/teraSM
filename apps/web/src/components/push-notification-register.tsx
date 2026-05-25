'use client'

import { useEffect } from 'react'
import { registerFcmToken } from '@/lib/firebase-client'

export function PushNotificationRegister() {
  useEffect(() => {
    // Only run once — skip if already granted or no config
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return
    if (Notification.permission === 'denied') return

    registerFcmToken().then(token => {
      if (!token) return
      fetch('/api/user/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    })
  }, [])

  return null
}
