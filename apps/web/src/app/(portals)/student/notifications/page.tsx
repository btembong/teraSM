'use client'

import { useEffect, useState } from 'react'
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'

type Prefs = {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

const CATEGORIES = [
  { key: 'assignment_due', label: 'Assignment Deadlines', description: 'Reminders when assignments are due soon' },
  { key: 'fee_due', label: 'Fee Due Dates', description: '7, 3, and 1-day reminders before fee deadlines' },
  { key: 'new_announcement', label: 'New Announcements', description: 'When school or department posts a new announcement' },
  { key: 'live_class', label: 'Live Class Reminders', description: 'Before a live class starts' },
  { key: 'grade_published', label: 'Results Published', description: 'When your grade or result is released' },
  { key: 'missed_class', label: 'Missed Class Alerts', description: 'When you are marked absent from a class' },
  { key: 'message', label: 'New Messages', description: 'When you receive a new direct message' },
]

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/user/notification-preferences').then(r => r.json()).then(setPrefs)
  }, [])

  async function update(key: keyof Prefs, value: boolean) {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setSaving(true)
    setSaved(false)
    await fetch('/api/user/notification-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-500 mt-1">Choose how and when you receive notifications</p>
        </div>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {saved && <span className="text-xs text-green-600 font-medium">Saved</span>}
      </div>

      {/* Channel toggles */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notification Channels</h2>
        </div>

        {[
          { key: 'pushNotifications' as keyof Prefs, label: 'Push Notifications', description: 'Browser and mobile push alerts', Icon: Smartphone },
          { key: 'emailNotifications' as keyof Prefs, label: 'Email Notifications', description: 'Sent to your registered email address', Icon: Mail },
          { key: 'smsNotifications' as keyof Prefs, label: 'SMS Notifications', description: 'Text messages to your phone number', Icon: MessageSquare },
        ].map(({ key, label, description, Icon }) => (
          <div key={key} className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <Toggle
              value={prefs?.[key] ?? false}
              onChange={v => update(key, v)}
              disabled={!prefs}
            />
          </div>
        ))}
      </div>

      {/* Category descriptions */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">What You&apos;ll Be Notified About</h2>
        </div>
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{cat.label}</p>
              <p className="text-xs text-gray-500">{cat.description}</p>
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Push notifications require browser permission. If you&apos;ve denied it, go to your browser settings to re-enable.
      </p>
    </div>
  )
}
