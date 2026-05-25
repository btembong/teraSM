'use client'

import { useEffect } from 'react'

export function AnnouncementsReadMarker({ ids }: { ids: string[] }) {
  useEffect(() => {
    ids.forEach(id => {
      fetch(`/api/announcements/${id}/read`, { method: 'POST' }).catch(() => {})
    })
  }, [ids])

  return null
}
