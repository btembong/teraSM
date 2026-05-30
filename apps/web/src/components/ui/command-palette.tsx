'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, X, UserPlus, Mail, Megaphone, FileText, Video, Brain,
  GraduationCap, DollarSign, BookOpen, Users, Settings, BarChart3,
  UserCog, CalendarDays, Vote, BadgeCheck, Keyboard,
} from 'lucide-react'

const ALL_ACTIONS = [
  { group: 'Quick Actions', label: 'Add User',          desc: 'Create a student, teacher or staff account', href: '/admin/students',            Icon: UserPlus    },
  { group: 'Quick Actions', label: 'Send Invite',        desc: 'Email an invite link to join the school',   href: '/admin/invites',              Icon: Mail        },
  { group: 'Quick Actions', label: 'Post Announcement',  desc: 'Broadcast a message school-wide',           href: '/admin/announcements',        Icon: Megaphone   },
  { group: 'Quick Actions', label: 'Create Invoice',     desc: 'Issue a new fee invoice to a student',      href: '/admin/finance/invoices',     Icon: FileText    },
  { group: 'Quick Actions', label: 'Schedule Class',     desc: 'Set up a live video class session',         href: '/admin/live-classes',         Icon: Video       },
  { group: 'Quick Actions', label: 'AI Early Warning',   desc: 'View at-risk student predictions',          href: '/admin/ai',                   Icon: Brain       },
  { group: 'Navigation',    label: 'Academics',          desc: 'Departments, courses, offerings',           href: '/admin/academics',            Icon: GraduationCap },
  { group: 'Navigation',    label: 'Finance',            desc: 'Fees, invoices, scholarships',              href: '/admin/finance',              Icon: DollarSign  },
  { group: 'Navigation',    label: 'LMS',                desc: 'Content, assignments, grading',             href: '/admin/lms',                  Icon: BookOpen    },
  { group: 'Navigation',    label: 'HR',                 desc: 'Staff, leave, payroll',                     href: '/admin/hr',                   Icon: UserCog     },
  { group: 'Navigation',    label: 'Students',           desc: 'Student records and profiles',              href: '/admin/students',             Icon: Users       },
  { group: 'Navigation',    label: 'Live Classes',       desc: 'Schedule and manage video sessions',        href: '/admin/live-classes',         Icon: Video       },
  { group: 'Navigation',    label: 'Calendar',           desc: 'Academic years and semesters',              href: '/admin/academics/calendar',   Icon: CalendarDays },
  { group: 'Navigation',    label: 'Announcements',      desc: 'School-wide broadcasts',                    href: '/admin/announcements',        Icon: Megaphone   },
  { group: 'Navigation',    label: 'Analytics',          desc: 'Reports and insights',                      href: '/admin/analytics',            Icon: BarChart3   },
  { group: 'Navigation',    label: 'Scholarships',       desc: 'Bursaries and financial aid',               href: '/admin/finance/scholarships', Icon: BadgeCheck  },
  { group: 'Navigation',    label: 'Elections',          desc: 'Student government voting',                 href: '/admin/elections',            Icon: Vote        },
  { group: 'Navigation',    label: 'Settings',           desc: 'Platform configuration',                    href: '/admin/settings',             Icon: Settings    },
]

/* ─── Chord shortcuts — press g then a second key ─────────── */
const CHORD_SHORTCUTS: Record<string, string> = {
  a: '/admin/academics',
  f: '/admin/finance',
  l: '/admin/lms',
  h: '/admin/hr',
  t: '/admin/students',
  n: '/admin/announcements',
  x: '/admin/analytics',
  s: '/admin/settings',
  v: '/admin/live-classes',
  i: '/admin/invites',
}

/* ─── Shortcuts reference data ───────────────────────────── */
const SHORTCUT_GROUPS = [
  {
    title: 'Global',
    items: [
      { keys: ['⌘', 'K'],       label: 'Open command palette' },
      { keys: ['?'],             label: 'Show keyboard shortcuts' },
      { keys: ['Esc'],           label: 'Close any modal / palette' },
    ],
  },
  {
    title: 'Go to (g + key)',
    items: [
      { keys: ['g', 'a'], label: 'Academics'    },
      { keys: ['g', 'f'], label: 'Finance'      },
      { keys: ['g', 'l'], label: 'LMS'          },
      { keys: ['g', 'h'], label: 'HR'           },
      { keys: ['g', 't'], label: 'Students'     },
      { keys: ['g', 'n'], label: 'Announcements' },
      { keys: ['g', 'x'], label: 'Analytics'    },
      { keys: ['g', 's'], label: 'Settings'     },
      { keys: ['g', 'v'], label: 'Live Classes' },
      { keys: ['g', 'i'], label: 'Invites'      },
    ],
  },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono text-[10px] text-slate-600 min-w-[20px] justify-center">
      {children}
    </kbd>
  )
}

export function CommandPalette() {
  const router  = useRouter()
  const [open,  setOpen]  = useState(false)
  const [sheet, setSheet] = useState(false)   // ? shortcuts sheet
  const [query, setQuery] = useState('')
  const inputRef  = useRef<HTMLInputElement>(null)
  const chordRef  = useRef(false)              // true when 'g' was just pressed
  const chordTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target as HTMLElement).isContentEditable

      // ⌘K / Ctrl+K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSheet(false)
        setOpen(o => !o)
        setQuery('')
        return
      }

      // Escape
      if (e.key === 'Escape') {
        setOpen(false)
        setSheet(false)
        chordRef.current = false
        clearTimeout(chordTimer.current)
        return
      }

      if (typing || open || sheet) return

      // ? — shortcuts sheet
      if (e.key === '?') {
        e.preventDefault()
        setSheet(s => !s)
        return
      }

      // Chord: g then second key
      if (chordRef.current) {
        chordRef.current = false
        clearTimeout(chordTimer.current)
        const dest = CHORD_SHORTCUTS[e.key]
        if (dest) { e.preventDefault(); router.push(dest) }
        return
      }

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        chordRef.current = true
        chordTimer.current = setTimeout(() => { chordRef.current = false }, 800)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(chordTimer.current) }
  }, [open, sheet, router])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = query.trim()
    ? ALL_ACTIONS.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.desc.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_ACTIONS

  const groups = [...new Set(filtered.map(a => a.group))]

  /* ── Shortcuts sheet ── */
  if (sheet) return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm"
      onClick={() => setSheet(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Keyboard className="w-4 h-4 text-slate-400" />
          <p className="flex-1 text-sm font-semibold text-slate-700">Keyboard Shortcuts</p>
          <button onClick={() => setSheet(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto py-3">
          {SHORTCUT_GROUPS.map(g => (
            <div key={g.title} className="mb-4">
              <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{g.title}</p>
              {g.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, j) => <Kbd key={j}>{k}</Kbd>)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-gray-50">
          <p className="text-[10px] text-slate-400">Press <Kbd>?</Kbd> anywhere to toggle this sheet</p>
        </div>
      </div>
    </div>
  )

  /* ── Command palette ── */
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search actions or pages..."
            className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 bg-transparent"
          />
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No results for &quot;{query}&quot;</p>
          ) : (
            groups.map(group => (
              <div key={group}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
                {filtered.filter(a => a.group === group).map(a => (
                  <Link
                    key={a.href + a.label}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <a.Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{a.label}</p>
                      <p className="text-xs text-slate-400 truncate">{a.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-50 flex items-center gap-4">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <Kbd>↵</Kbd> to open
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <Kbd>Esc</Kbd> to close
          </span>
          <button
            onClick={() => { setOpen(false); setSheet(true) }}
            className="ml-auto text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <Kbd>?</Kbd> shortcuts
          </button>
        </div>
      </div>
    </div>
  )
}
