'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, GraduationCap, Building2, BookOpen, CalendarRange,
  DollarSign, CreditCard, FileText, Award, UserCog, Users, CalendarOff,
  Library, Video, Megaphone, Smile, Vote, Briefcase, Bot, BarChart2,
  Settings, UserPlus, X, ArrowRight,
} from 'lucide-react'

// ─── Command definitions ──────────────────────────────────────────────────────

interface Command {
  label: string
  desc?: string
  href: string
  Icon: React.ComponentType<{ className?: string }>
  category: string
  keywords?: string
}

const COMMANDS: Command[] = [
  // Dashboard
  { label: 'Dashboard', desc: 'Admin home overview', href: '/admin', Icon: LayoutDashboard, category: 'Navigation' },

  // Academics
  { label: 'Academics Overview', href: '/admin/academics', Icon: GraduationCap, category: 'Academics' },
  { label: 'Departments', href: '/admin/academics/departments', Icon: Building2, category: 'Academics' },
  { label: 'Courses', href: '/admin/academics/courses', Icon: BookOpen, category: 'Academics' },
  { label: 'Academic Years', href: '/admin/academics/years', Icon: CalendarRange, category: 'Academics' },

  // Finance
  { label: 'Finance Overview', href: '/admin/finance', Icon: DollarSign, category: 'Finance' },
  { label: 'Fee Structures', href: '/admin/finance/fees', Icon: CreditCard, category: 'Finance' },
  { label: 'Invoices', href: '/admin/finance/invoices', Icon: FileText, category: 'Finance', keywords: 'billing payment' },
  { label: 'Scholarships', href: '/admin/finance/scholarships', Icon: Award, category: 'Finance', keywords: 'bursary financial aid' },

  // HR
  { label: 'HR Overview', href: '/admin/hr', Icon: UserCog, category: 'HR' },
  { label: 'Employees', href: '/admin/hr/employees', Icon: Users, category: 'HR', keywords: 'staff teachers' },
  { label: 'Leave Requests', href: '/admin/hr/leave', Icon: CalendarOff, category: 'HR' },
  { label: 'Payroll', href: '/admin/hr/payroll', Icon: CreditCard, category: 'HR', keywords: 'salary payslip' },

  // Content & Classes
  { label: 'LMS', desc: 'Course content & assignments', href: '/admin/lms', Icon: Library, category: 'Content' },
  { label: 'Live Classes', href: '/admin/live-classes', Icon: Video, category: 'Content', keywords: 'video conference' },

  // Communication
  { label: 'Announcements', href: '/admin/announcements', Icon: Megaphone, category: 'Communication', keywords: 'broadcast message news' },

  // Student life
  { label: 'Student Life', desc: 'Clubs, events, hostel', href: '/admin/student-life', Icon: Smile, category: 'Student Life' },
  { label: 'Elections', href: '/admin/elections', Icon: Vote, category: 'Student Life', keywords: 'voting polls' },
  { label: 'Career Center', href: '/admin/career', Icon: Briefcase, category: 'Student Life', keywords: 'jobs internships alumni' },

  // Platform
  { label: 'AI & Intelligence', href: '/admin/ai', Icon: Bot, category: 'Platform', keywords: 'early warning prediction chatbot advisor' },
  { label: 'Reports', href: '/admin/reports', Icon: BarChart2, category: 'Platform', keywords: 'analytics charts export' },
  { label: 'All Users', href: '/admin/students', Icon: Users, category: 'Platform', keywords: 'students teachers staff manage' },
  { label: 'Invitations', href: '/admin/invites', Icon: UserPlus, category: 'Platform', keywords: 'invite email onboard' },
  { label: 'Settings', href: '/admin/settings', Icon: Settings, category: 'Platform', keywords: 'branding api webhooks billing' },
]

const CATEGORIES = [...new Set(COMMANDS.map(c => c.category))]

// ─── Filter ───────────────────────────────────────────────────────────────────

function filterCommands(query: string): Command[] {
  if (!query.trim()) return COMMANDS
  const q = query.toLowerCase()
  return COMMANDS.filter(c =>
    c.label.toLowerCase().includes(q) ||
    (c.desc ?? '').toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    (c.keywords ?? '').toLowerCase().includes(q)
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = filterCommands(query)

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  // Keyboard navigation within results
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      navigate(results[activeIdx].href)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  // Group results by category
  const grouped: Record<string, Command[]> = {}
  results.forEach(cmd => {
    if (!grouped[cmd.category]) grouped[cmd.category] = []
    grouped[cmd.category].push(cmd)
  })

  // Flat index lookup
  let flatIdx = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs font-mono text-gray-400">esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">No results for &quot;{query}&quot;</p>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{category}</p>
                {cmds.map(cmd => {
                  const idx = flatIdx++
                  const isActive = idx === activeIdx
                  return (
                    <button
                      key={cmd.href}
                      data-idx={idx}
                      onClick={() => navigate(cmd.href)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <cmd.Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{cmd.label}</p>
                        {cmd.desc && <p className="text-xs text-gray-400 truncate">{cmd.desc}</p>}
                      </div>
                      {isActive && <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><kbd className="font-mono border border-gray-200 rounded px-1 bg-gray-50">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="font-mono border border-gray-200 rounded px-1 bg-gray-50">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="font-mono border border-gray-200 rounded px-1 bg-gray-50">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
