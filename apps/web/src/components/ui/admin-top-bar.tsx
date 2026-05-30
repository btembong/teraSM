'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Search, ChevronDown, LogOut, Settings, User, Building2, Check, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'

interface Campus { id: string; name: string; code: string; isMain: boolean }

interface Notif {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  isRead: boolean
  createdAt: string
}

interface AdminTopBarProps {
  userName: string
  userEmail: string
  semester?: string
  unreadCount?: number
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_COLOR: Record<string, string> = {
  ANNOUNCEMENT:      'bg-blue-100 text-blue-600',
  GRADE_PUBLISHED:   'bg-green-100 text-green-600',
  FEE_DUE:           'bg-amber-100 text-amber-600',
  ASSIGNMENT_DUE:    'bg-purple-100 text-purple-600',
  MISSED_CLASS:      'bg-red-100 text-red-600',
  LIVE_CLASS_STARTING: 'bg-indigo-100 text-indigo-600',
  MESSAGE:           'bg-teal-100 text-teal-600',
  GENERAL:           'bg-gray-100 text-gray-500',
}

export function AdminTopBar({ userName, userEmail, semester, unreadCount: initialUnread = 0 }: AdminTopBarProps) {
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [campusOpen,   setCampusOpen]   = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [campuses,     setCampuses]     = useState<Campus[]>([])
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [notifLoading,  setNotifLoading]  = useState(false)
  const [localUnread,   setLocalUnread]   = useState(initialUnread)

  const menuRef   = useRef<HTMLDivElement>(null)
  const campusRef = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalUnread(initialUnread) }, [initialUnread])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current   && !menuRef.current.contains(e.target as Node))   setMenuOpen(false)
      if (campusRef.current && !campusRef.current.contains(e.target as Node)) setCampusOpen(false)
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    fetch('/api/admin/campuses')
      .then(r => r.ok ? r.json() : [])
      .then((list: Campus[]) => {
        if (!Array.isArray(list) || list.length <= 1) return
        setCampuses(list)
        const stored = localStorage.getItem('activeCampusId')
        const found  = stored ? list.find(c => c.id === stored) : null
        setActiveCampus(found ?? list.find(c => c.isMain) ?? list[0])
      })
      .catch(() => {})
  }, [])

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifications(await res.json())
    } finally {
      setNotifLoading(false)
    }
  }, [])

  async function openNotifs() {
    setNotifOpen(v => {
      if (!v) fetchNotifications()
      return !v
    })
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setLocalUnread(0)
  }

  function switchCampus(c: Campus) {
    setActiveCampus(c)
    localStorage.setItem('activeCampusId', c.id)
    setCampusOpen(false)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6 gap-4 flex-shrink-0">
      {/* Ctrl+K hint */}
      <button
        data-tour="search"
        className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors flex-1 max-w-xs"
        onClick={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
        }}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Quick search…</span>
        <kbd className="ml-auto text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-400">⌘K</kbd>
      </button>

      {/* Campus switcher — only shown when multiple campuses exist */}
      {campuses.length > 1 && activeCampus && (
        <div className="relative" ref={campusRef}>
          <button
            onClick={() => setCampusOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="max-w-[120px] truncate font-medium">{activeCampus.name}</span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${campusOpen ? 'rotate-180' : ''}`} />
          </button>

          {campusOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-2xl shadow-lg py-1.5 z-50">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Switch Campus</p>
              {campuses.map(c => (
                <button
                  key={c.id}
                  onClick={() => switchCampus(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{c.name}</span>
                  {c.id === activeCampus.id && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Link href="/admin/campuses" className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors" onClick={() => setCampusOpen(false)}>
                  Manage campuses →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Date + semester */}
        <div className="hidden sm:flex flex-col items-end leading-none gap-0.5">
          <span className="text-xs font-medium text-gray-700">{today}</span>
          {semester && <span className="text-[11px] text-gray-400">{semester}</span>}
        </div>

        {/* Notification bell + dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifs}
            className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-4.5 h-4.5 text-gray-500" />
            {localUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">Notifications</span>
                  {localUnread > 0 && (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">{localUnread}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {localUnread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${TYPE_COLOR[n.type] ?? TYPE_COLOR.GENERAL}`}>
                        {n.type.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {n.link && (
                        <Link href={n.link} onClick={() => setNotifOpen(false)} className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 self-start mt-0.5">
                          <ExternalLink className="w-3 h-3 text-gray-300" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-4 py-2.5">
                <Link
                  href="/admin/announcements"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all communications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Avatar name={userName} size="sm" />
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-2xl shadow-lg py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </Link>
              <Link
                href="/admin/students"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-4 h-4 text-gray-400" />
                My Profile
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Link
                  href="/signout"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                  Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
