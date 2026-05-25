'use client'

import { useEffect, useState } from 'react'

let cache: { announcements: number; notifications: number } | null = null
let listeners: Array<() => void> = []

function notifyListeners() { listeners.forEach(fn => fn()) }

export async function refreshUnreadCounts() {
  const res = await fetch('/api/notifications/unread-count')
  if (res.ok) {
    cache = await res.json()
    notifyListeners()
  }
}

export function useUnreadCounts() {
  const [counts, setCounts] = useState(cache ?? { announcements: 0, notifications: 0 })

  useEffect(() => {
    const update = () => setCounts(cache ?? { announcements: 0, notifications: 0 })
    listeners.push(update)
    if (!cache) refreshUnreadCounts()
    else update()
    return () => { listeners = listeners.filter(fn => fn !== update) }
  }, [])

  return counts
}

export function AnnouncementBadge() {
  const { announcements } = useUnreadCounts()
  if (announcements <= 0) return null
  return (
    <span className="ml-auto flex-shrink-0 min-w-[1.25rem] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
      {announcements > 99 ? '99+' : announcements}
    </span>
  )
}
