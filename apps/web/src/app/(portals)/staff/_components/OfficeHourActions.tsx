'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OfficeHourActions({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null)

  async function update(status: 'CONFIRMED' | 'CANCELLED') {
    setLoading(status === 'CONFIRMED' ? 'confirm' : 'cancel')
    await fetch(`/api/staff/office-hours/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => update('CONFIRMED')}
        disabled={loading !== null}
        title="Confirm"
        className="w-6 h-6 rounded-full bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition disabled:opacity-50"
      >
        {loading === 'confirm' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button
        onClick={() => update('CANCELLED')}
        disabled={loading !== null}
        title="Decline"
        className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition disabled:opacity-50"
      >
        {loading === 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
      </button>
    </div>
  )
}
