'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, ChevronDown, LogOut, Settings, User, Building2, Check } from 'lucide-react'
import Link from 'next/link'

interface Campus { id: string; name: string; code: string; isMain: boolean }

interface AdminTopBarProps {
  userName: string
  userEmail: string
  semester?: string
  unreadCount?: number
}

export function AdminTopBar({ userName, userEmail, semester, unreadCount = 0 }: AdminTopBarProps) {
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [campusOpen,   setCampusOpen]   = useState(false)
  const [campuses,     setCampuses]     = useState<Campus[]>([])
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null)
  const menuRef   = useRef<HTMLDivElement>(null)
  const campusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (campusRef.current && !campusRef.current.contains(e.target as Node)) setCampusOpen(false)
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

  function switchCampus(c: Campus) {
    setActiveCampus(c)
    localStorage.setItem('activeCampusId', c.id)
    setCampusOpen(false)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6 gap-4 flex-shrink-0">
      {/* Ctrl+K hint */}
      <button
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

        {/* Notifications */}
        <Link href="/admin/announcements" className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <Bell className="w-4.5 h-4.5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Link>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
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
