'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Mail, MessageSquare, Smartphone, BookOpen, DollarSign, GraduationCap, UserX, Megaphone, Video } from 'lucide-react'

type Channels = {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
}

type CategoryPref = { email: boolean; sms: boolean; push: boolean }

const CATEGORIES = [
  { key: 'ANNOUNCEMENT',       label: 'Announcements',       description: 'School-wide and department announcements', Icon: Megaphone },
  { key: 'GRADE_PUBLISHED',    label: 'Results Published',   description: 'When your grade or exam result is released', Icon: GraduationCap },
  { key: 'ASSIGNMENT_DUE',     label: 'Assignment Deadlines', description: 'Reminders when assignments are due soon', Icon: BookOpen },
  { key: 'FEE_DUE',            label: 'Fee Due Dates',        description: '7, 3, and 1-day alerts before fee deadlines', Icon: DollarSign },
  { key: 'LIVE_CLASS_STARTING', label: 'Live Class Reminders', description: 'Before a scheduled live class begins', Icon: Video },
  { key: 'MISSED_CLASS',       label: 'Missed Class Alerts',  description: 'When you are marked absent from a class', Icon: UserX },
  { key: 'MESSAGE',            label: 'New Messages',         description: 'When you receive a direct message', Icon: MessageSquare },
] as const

type CategoryKey = typeof CATEGORIES[number]['key']

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}


export default function NotificationPreferencesPage() {
  const [channels,   setChannels]   = useState<Channels | null>(null)
  const [categories, setCategories] = useState<Record<string, CategoryPref>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved,  setSaved]  = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/notification-preferences')
      .then(r => r.json())
      .then(d => {
        setChannels(d.channels)
        setCategories(d.categories ?? {})
      })
  }, [])

  const flash = useCallback((key: string) => {
    setSaved(key)
    setTimeout(() => setSaved(v => v === key ? null : v), 2000)
  }, [])

  async function updateChannel(key: keyof Channels, value: boolean) {
    if (!channels) return
    setChannels(prev => prev ? { ...prev, [key]: value } : prev)
    setSaving(key)
    await fetch('/api/user/notification-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
    setSaving(null)
    flash(key)
  }

  async function updateCategory(category: CategoryKey, channel: 'email' | 'sms' | 'push', value: boolean) {
    const key = `${category}_${channel}`
    setCategories(prev => ({
      ...prev,
      [category]: { ...prev[category], [channel]: value },
    }))
    setSaving(key)
    await fetch('/api/user/notification-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, [channel]: value }),
    })
    setSaving(null)
    flash(key)
  }

  const loaded = channels !== null

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-500 mt-1">Choose how and when you receive notifications</p>
      </div>

      {/* Master channel toggles */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notification Channels</h2>
          <p className="text-xs text-gray-400 mt-0.5">Master switches — turning off a channel silences it for all categories</p>
        </div>
        {([
          { key: 'pushNotifications'  as keyof Channels, label: 'Push Notifications', description: 'Browser and mobile push alerts', Icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
          { key: 'emailNotifications' as keyof Channels, label: 'Email Notifications', description: 'Sent to your registered email',   Icon: Mail,        color: 'text-blue-600',   bg: 'bg-blue-50' },
          { key: 'smsNotifications'   as keyof Channels, label: 'SMS Notifications',   description: 'Text messages to your phone',      Icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
        ] as const).map(({ key, label, description, Icon, color, bg }) => (
          <div key={key} className="flex items-center gap-4 px-5 py-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            {saved === key && <span className="text-xs text-green-600 font-medium">Saved</span>}
            {saving === key && <span className="text-xs text-gray-400">Saving…</span>}
            <Toggle value={channels?.[key] ?? false} onChange={v => updateChannel(key, v)} disabled={!loaded} />
          </div>
        ))}
      </div>

      {/* Per-category toggles */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Per-Category Settings</h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-medium text-gray-400 uppercase tracking-wide pr-1">
            <span className="w-6 text-center">Push</span>
            <span className="w-6 text-center">Email</span>
            <span className="w-6 text-center">SMS</span>
          </div>
        </div>

        {CATEGORIES.map(({ key, label, description, Icon }, idx) => {
          const pref = categories[key] ?? { email: true, sms: false, push: true }
          return (
            <div key={key} className={`flex items-center gap-4 px-5 py-3.5 ${idx < CATEGORIES.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 truncate">{description}</p>
              </div>
              <div className="flex items-center gap-3">
                {(['push', 'email', 'sms'] as const).map(ch => (
                  <div key={ch} className="w-6 flex justify-center">
                    <Toggle
                      value={pref[ch]}
                      onChange={v => updateCategory(key, ch, v)}
                      disabled={!loaded}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400">
        Push notifications require browser permission. SMS requires a verified phone number on your profile.
      </p>
    </div>
  )
}
