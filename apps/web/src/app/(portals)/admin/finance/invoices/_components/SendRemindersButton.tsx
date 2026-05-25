'use client'

import { useState } from 'react'
import { Bell, CheckCircle } from 'lucide-react'

export function SendRemindersButton() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function send() {
    setSending(true)
    const res = await fetch('/api/admin/finance/reminders', { method: 'POST' })
    const d = await res.json()
    setResult(res.ok ? `${d.notificationsSent} reminder${d.notificationsSent !== 1 ? 's' : ''} sent` : d.error ?? 'Failed')
    setSending(false)
    setTimeout(() => setResult(null), 4000)
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />{result}
        </span>
      )}
      <button
        onClick={send}
        disabled={sending}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {sending ? 'Sending...' : 'Send reminders'}
      </button>
    </div>
  )
}
