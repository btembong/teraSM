'use client'

import { useState, useEffect, useRef, useContext, createContext, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, Code2, Webhook, ChevronDown, Copy, Check,
  Terminal, Key, Shield, Zap, AlertCircle, CheckCircle2,
  Users, GraduationCap, DollarSign, Search, ArrowUp, Play,
  ExternalLink, Video, Briefcase, MessageSquare, Bell, X,
  Brain, Vote, Library, Upload, Settings,
  CalendarDays, ClipboardCheck, Megaphone,
} from 'lucide-react'

// ─── filter context ───────────────────────────────────────────────────────────

const DocsFilter = createContext({ search: '', method: 'ALL' })

// ─── primitives ──────────────────────────────────────────────────────────────

function CopyBtn({ text, light = false }: { text: string; light?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
        light
          ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/10'
      }`}
    >
      {copied
        ? <><Check className="w-3 h-3 text-blue-400" /><span className={!light ? 'text-blue-400' : ''}>Copied</span></>
        : <><Copy className="w-3 h-3" />Copy</>}
    </button>
  )
}

// ─── JSON syntax highlighter ─────────────────────────────────────────────────

function JsonHighlight({ code }: { code: string }) {
  const tokens = code.split(/(\"(?:[^\"\\]|\\.)*\"\s*:?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?)/g)
  return (
    <>
      {tokens.map((tok, i) => {
        if (!tok) return null
        if (/^"[^"]*"\s*:/.test(tok)) return <span key={i} className="text-blue-400">{tok}</span>
        if (/^"/.test(tok))           return <span key={i} className="text-emerald-400">{tok}</span>
        if (tok === 'true' || tok === 'false') return <span key={i} className="text-orange-400">{tok}</span>
        if (tok === 'null')           return <span key={i} className="text-red-400">{tok}</span>
        if (/^-?\d/.test(tok))        return <span key={i} className="text-amber-400">{tok}</span>
        return <span key={i} className="text-gray-500">{tok}</span>
      })}
    </>
  )
}

function Code({ children, lang = 'bash' }: { children: string; lang?: string }) {
  const langLabel: Record<string, string> = {
    bash: 'Terminal', json: 'JSON', typescript: 'TypeScript', text: 'URL', javascript: 'JavaScript',
  }
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl shadow-black/20 mt-3 border border-white/5">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1c1c1e] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[11px] text-gray-500 font-medium tracking-wide">{langLabel[lang] ?? lang}</span>
        </div>
        <CopyBtn text={children} />
      </div>
      <div className="bg-[#141416] px-5 py-4 overflow-x-auto">
        <pre className="text-[13px] font-mono leading-6 whitespace-pre">
          {lang === 'json' ? <JsonHighlight code={children} /> : <span className="text-gray-300">{children}</span>}
        </pre>
      </div>
    </div>
  )
}

// ─── badge ────────────────────────────────────────────────────────────────────

function Badge({ method }: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' }) {
  const c = {
    GET:    'bg-blue-50   dark:bg-blue-950   text-blue-600   dark:text-blue-400   border-blue-200   dark:border-blue-900',
    POST:   'bg-green-50  dark:bg-green-950  text-green-700  dark:text-green-400  border-green-200  dark:border-green-900',
    PATCH:  'bg-amber-50  dark:bg-amber-950  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-900',
    PUT:    'bg-amber-50  dark:bg-amber-950  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-900',
    DELETE: 'bg-red-50    dark:bg-red-950    text-red-600    dark:text-red-400    border-red-200    dark:border-red-900',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border tracking-wider flex-shrink-0 ${c[method]}`}>
      {method}
    </span>
  )
}

// ─── endpoint row ─────────────────────────────────────────────────────────────

type Param = { name: string; type: string; required?: boolean; desc: string }

function EP({ method, path, desc, params, body, response, example }: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  path: string; desc: string
  params?: Param[]; body?: Param[]
  response: string; example?: string
}) {
  const { search, method: mFilter } = useContext(DocsFilter)
  const [open, setOpen] = useState(false)
  const [showTry, setShowTry] = useState(false)
  const [tryVals, setTryVals] = useState<Record<string, string>>({})
  const [copiedPath, setCopiedPath] = useState(false)

  // Filter
  if (mFilter !== 'ALL' && method !== mFilter) return null
  const q = search.toLowerCase()
  if (q && !path.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) return null

  // Build curl command from try-it values
  const curlCmd = useMemo(() => {
    const base = 'https://your-school.terasms.com'
    const qs = params?.filter(p => tryVals[p.name]).map(p => `${p.name}=${encodeURIComponent(tryVals[p.name])}`).join('&')
    const url = `${base}${path.replace('/api', '/api')}${qs ? `?${qs}` : ''}`
    const bodyObj = body?.reduce<Record<string,string>>((a, p) => { if (tryVals[p.name]) a[p.name] = tryVals[p.name]; return a }, {})
    const hasBody = bodyObj && Object.keys(bodyObj).length > 0
    const lines = [
      `curl${method !== 'GET' ? ` -X ${method}` : ''} "${url}" \\`,
      `  -H "Authorization: Bearer tsk_live_xxxx"${hasBody ? ' \\' : ''}`,
      hasBody ? `  -H "Content-Type: application/json" \\` : '',
      hasBody ? `  -d '${JSON.stringify(bodyObj, null, 2)}'` : '',
    ].filter(Boolean)
    return lines.join('\n')
  }, [method, path, params, body, tryVals])

  const copyPath = () => {
    navigator.clipboard.writeText(path)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 1500)
  }

  const hasTryFields = (params?.length ?? 0) + (body?.length ?? 0) > 0

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-200 ${open ? 'border-blue-200 dark:border-blue-900 shadow-md shadow-blue-50 dark:shadow-blue-950/30' : 'border-gray-200 dark:border-gray-800'}`}>
      {/* Header row */}
      <div className="flex items-center bg-white dark:bg-gray-900">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors text-left">
          <Badge method={method} />
          <span className="font-mono text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">{path}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:block shrink-0 max-w-[180px] truncate">{desc}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>
        {/* Copy path button */}
        <button
          onClick={copyPath}
          title="Copy path"
          className="px-3 py-3.5 border-l border-gray-100 dark:border-gray-800 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          {copiedPath ? <Check className="w-3.5 h-3.5 text-blue-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0f0f11] p-5 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>

          {params && params.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Query Parameters</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {params.map(p => (
                  <div key={p.name} className="flex items-start gap-4 px-4 py-2.5 bg-white dark:bg-gray-900/50">
                    <code className="font-mono text-blue-600 dark:text-blue-400 text-xs min-w-[120px] pt-0.5">{p.name}</code>
                    <code className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono min-w-[70px] text-center self-start">{p.type}</code>
                    {p.required && <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-1.5 py-0.5 rounded self-start">required</span>}
                    <span className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed flex-1">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {body && body.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Request Body — JSON</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {body.map(p => (
                  <div key={p.name} className="flex items-start gap-4 px-4 py-2.5 bg-white dark:bg-gray-900/50">
                    <code className="font-mono text-emerald-600 dark:text-emerald-400 text-xs min-w-[120px] pt-0.5">{p.name}</code>
                    <code className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono min-w-[70px] text-center self-start">{p.type}</code>
                    {p.required && <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-1.5 py-0.5 rounded self-start">required</span>}
                    <span className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed flex-1">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Response</p>
            <Code lang="json">{response}</Code>
          </div>
          {example && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Example Request</p>
              <Code lang="bash">{example}</Code>
            </div>
          )}

          {/* Try it / curl builder */}
          {hasTryFields && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowTry(t => !t)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Play className="w-3 h-3 text-blue-500" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex-1 text-left">Try It — curl builder</p>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTry ? 'rotate-180' : ''}`} />
              </button>
              {showTry && (
                <div className="bg-[#0d0d0f] p-4 space-y-3">
                  {[...(params ?? []).map(p => ({ ...p, kind: 'query' })), ...(body ?? []).map(p => ({ ...p, kind: 'body' }))].map(p => (
                    <div key={p.name} className="flex items-center gap-3">
                      <code className={`text-xs min-w-[130px] ${p.kind === 'query' ? 'text-blue-400' : 'text-emerald-400'}`}>{p.name}</code>
                      <input
                        value={tryVals[p.name] ?? ''}
                        onChange={e => setTryVals(v => ({ ...v, [p.name]: e.target.value }))}
                        placeholder={`${p.type}${p.required ? ' *' : ''}`}
                        className="flex-1 bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-800">
                    <Code lang="bash">{curlCmd}</Code>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({ id, icon: Icon, title, color, children }: {
  id: string; icon: React.ComponentType<{ className?: string }>;
  title: string; color: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

// ─── sidebar items ────────────────────────────────────────────────────────────

const nav = [
  { label: 'Overview',        href: '#overview',       icon: BookOpen },
  { label: 'Authentication',  href: '#auth',           icon: Key },
  { label: 'Auth & Register', href: '#auth-endpoints', icon: Shield },
  { label: 'Profile & 2FA',   href: '#profile',        icon: Key },
  { label: 'Academics',       href: '#academics',      icon: GraduationCap },
  { label: 'Admissions',      href: '#admissions',     icon: ClipboardCheck },
  { label: 'LMS',             href: '#lms',            icon: BookOpen },
  { label: 'Live Classes',    href: '#live-classes',   icon: Video },
  { label: 'Finance',         href: '#finance',        icon: DollarSign },
  { label: 'HR',              href: '#hr',             icon: Briefcase },
  { label: 'Student Portal',  href: '#student-portal', icon: Users },
  { label: 'Staff Portal',    href: '#staff-portal',   icon: GraduationCap },
  { label: 'Admin Ops',       href: '#admin-ops',      icon: Settings },
  { label: 'Users & Invites', href: '#users',          icon: Users },
  { label: 'Announcements',   href: '#announcements',  icon: Megaphone },
  { label: 'Chat',            href: '#chat',           icon: MessageSquare },
  { label: 'Notifications',   href: '#notifications',  icon: Bell },
  { label: 'Student Life',    href: '#student-life',   icon: CalendarDays },
  { label: 'AI Features',     href: '#ai',             icon: Brain },
  { label: 'Elections',       href: '#elections',      icon: Vote },
  { label: 'Career & Jobs',   href: '#career',         icon: Briefcase },
  { label: 'Library',         href: '#library',        icon: Library },
  { label: 'Admin Settings',  href: '#admin',          icon: Settings },
  { label: 'Billing & GDPR',  href: '#billing',        icon: DollarSign },
  { label: 'File Upload',     href: '#upload',         icon: Upload },
  { label: 'Public API v1',   href: '#v1',             icon: Code2 },
  { label: 'Webhooks',        href: '#webhooks',       icon: Webhook },
  { label: 'Rate Limits',     href: '#rate-limits',    icon: Shield },
]

const BASE = 'https://your-school.terasms.com'
const AUTH = '-H "Authorization: Bearer tsk_live_xxxx"'

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'GET' | 'POST' | 'PATCH' | 'DELETE'>('ALL')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    const sections = document.querySelectorAll('section[id], div[id]')
    sections.forEach(s => observerRef.current?.observe(s))
    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') searchRef.current?.blur()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navGroups = [
    { label: 'Core',      items: nav.filter(n => ['#overview','#auth','#auth-endpoints','#profile'].includes(n.href)) },
    { label: 'Academic',  items: nav.filter(n => ['#academics','#admissions','#lms','#live-classes'].includes(n.href)) },
    { label: 'Business',  items: nav.filter(n => ['#finance','#hr','#admin-ops','#billing'].includes(n.href)) },
    { label: 'Portals',   items: nav.filter(n => ['#student-portal','#staff-portal','#users','#admin'].includes(n.href)) },
    { label: 'Community', items: nav.filter(n => ['#announcements','#chat','#notifications','#student-life'].includes(n.href)) },
    { label: 'Platform',  items: nav.filter(n => ['#ai','#elections','#career','#library','#upload','#v1','#webhooks','#rate-limits'].includes(n.href)) },
  ]

  return (
    <div className="bg-white dark:bg-gray-950">
    <DocsFilter.Provider value={{ search, method: methodFilter }}>

      {/* Dark hero */}
      <section className="bg-gray-950 px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-full text-xs font-semibold mb-5">
            <Terminal className="w-3.5 h-3.5" /> REST API — v1
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            API Documentation
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mb-8">
            Complete reference for all Tera SM API endpoints. Every route, parameter, and response — documented and ready to integrate.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: CheckCircle2, label: 'REST + JSON' },
              { icon: Shield,       label: 'Bearer token auth' },
              { icon: Zap,          label: '200+ endpoints' },
              { icon: Code2,        label: 'Pro plan & above' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-full text-xs font-medium">
                <b.icon className="w-3.5 h-3.5 text-blue-400" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick-start strip */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-5 grid sm:grid-cols-3 gap-5">
          {[
            { step: '1', title: 'Get an API key', desc: 'Admin → Settings → API Keys → Generate new key', icon: Key },
            { step: '2', title: 'Set the header', desc: 'Authorization: Bearer tsk_live_xxxx', icon: Terminal },
            { step: '3', title: 'Make a request', desc: 'GET /api/v1/students', icon: Code2 },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{s.step}</div>
              <div>
                <p className="text-white text-xs font-semibold mb-0.5">{s.title}</p>
                <p className="text-gray-400 text-xs font-mono">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky search + method filter */}
      <div className="sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search endpoints… (Ctrl+K)"
              className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {(['ALL','GET','POST','PATCH','DELETE'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  methodFilter === m
                    ? m === 'ALL'    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : m === 'GET'    ? 'bg-blue-600 text-white'
                    : m === 'POST'   ? 'bg-green-600 text-white'
                    : m === 'PATCH'  ? 'bg-amber-500 text-white'
                    : 'bg-red-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >{m}</button>
            ))}
          </div>
        </div>
        {/* Mobile section quick-jump */}
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2 no-scrollbar">
            {nav.map(n => (
              <a key={n.label} href={n.href}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeSection === n.href.slice(1)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <n.icon className="w-3 h-3" />{n.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-10">
          {/* Grouped sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
              {navGroups.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-1">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map(n => {
                      const isActive = activeSection === n.href.slice(1)
                      return (
                        <a key={n.label} href={n.href}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <n.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-500' : ''}`} />{n.label}
                        </a>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-16">

          {/* Overview */}
          <section id="overview" className="scroll-mt-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
              Overview
            </h2>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="m-0">The internal API (session-authenticated) is used by the portals. The <strong className="text-gray-900 dark:text-white">Public REST API v1</strong> (bearer token) is available on <strong>Pro and above</strong> plans.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Base URL (internal)</p>
                <Code lang="text">{`${BASE}/api`}</Code>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Base URL (public API)</p>
                <Code lang="text">{`${BASE}/api/v1`}</Code>
              </div>
              <p>All responses are JSON. All dates are ISO 8601. Paginated responses return <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-xs">{"{ data, total, page, pages }"}</code>.</p>
            </div>
          </section>

          {/* Authentication */}
          <section id="auth" className="scroll-mt-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center"><Key className="w-5 h-5 text-white" /></div>
              Authentication
            </h2>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Portal endpoints use <strong className="text-gray-900 dark:text-white">NextAuth session cookies</strong> (automatic when logged in). The public <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">/api/v1/*</code> endpoints use a <strong className="text-gray-900 dark:text-white">Bearer API key</strong>:</p>
              <Code lang="bash">{`curl ${BASE}/api/v1/students \\
  -H "Authorization: Bearer tsk_live_xxxxxxxxxxxxxxxx"`}</Code>
              <p>Generate API keys from <strong className="text-gray-900 dark:text-white">Admin → Settings → API Keys</strong>. Keys are tenant-scoped and SHA-256 hashed at rest.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { t: '401 Unauthorized', d: 'Missing or invalid session / API key' },
                  { t: '403 Forbidden', d: 'Valid key but insufficient permissions' },
                  { t: '409 Conflict', d: 'Resource already exists (duplicate)' },
                  { t: '429 Too Many Requests', d: 'Rate limit exceeded — check X-RateLimit-Reset' },
                ].map(e => (
                  <div key={e.t} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                    <p className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{e.t}</p>
                    <p className="text-xs text-gray-500 mt-1">{e.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Auth endpoints */}
          <Section id="auth-endpoints" icon={Shield} title="Auth & Registration" color="bg-slate-600">
            <EP method="POST" path="/api/auth/register" desc="Register a new school tenant + admin account"
              body={[
                { name: 'schoolName', type: 'string', required: true, desc: 'School / institution name' },
                { name: 'firstName', type: 'string', required: true, desc: 'Admin first name' },
                { name: 'lastName', type: 'string', required: true, desc: 'Admin last name' },
                { name: 'email', type: 'string', required: true, desc: 'Admin email address' },
                { name: 'password', type: 'string', required: true, desc: 'Min 8 characters' },
                { name: 'logoUrl', type: 'string', desc: 'URL of uploaded school logo' },
              ]}
              response={`{ "tenantId": "tnt_abc", "userId": "usr_xyz", "redirectUrl": "/dashboard" }`}
            />
            <EP method="GET" path="/api/auth/schools" desc="List all registered schools (used on login page for tenant selection)"
              response={`[{ "id": "tnt_abc", "name": "Ashesi University", "slug": "ashesi", "logoUrl": "..." }]`}
            />
            <EP method="POST" path="/api/auth/send-otp" desc="Send OTP code to email for 2FA"
              body={[{ name: 'email', type: 'string', required: true, desc: 'Target email address' }]}
              response={`{ "success": true }`}
            />
            <EP method="POST" path="/api/auth/verify-otp" desc="Verify OTP code"
              body={[
                { name: 'email', type: 'string', required: true, desc: 'Email address' },
                { name: 'code', type: 'string', required: true, desc: '6-digit OTP code' },
              ]}
              response={`{ "valid": true }`}
            />
            <EP method="POST" path="/api/onboarding/complete" desc="Mark onboarding as complete for the current user"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/tenants/current" desc="Get current tenant info (branding, plan, settings)"
              response={`{ "id": "tnt_abc", "name": "Ashesi University", "slug": "ashesi", "plan": "PRO", "logoUrl": "...", "primaryColor": "#3b5bff" }`}
            />
          </Section>

          {/* Profile & 2FA */}
          <Section id="profile" icon={Key} title="Profile & Two-Factor Auth" color="bg-slate-700">
            <EP method="GET" path="/api/profile/2fa/status" desc="Check if 2FA is enabled for the current user"
              response={`{ "enabled": true, "method": "TOTP" }`}
            />
            <EP method="POST" path="/api/profile/2fa" desc="Enable 2FA — returns TOTP secret and QR code URI"
              response={`{ "secret": "BASE32SECRET", "otpAuthUrl": "otpauth://totp/TeraSM:user@school.edu?secret=..." }`}
            />
            <EP method="DELETE" path="/api/profile/2fa" desc="Disable 2FA for the current user"
              body={[{ name: 'code', type: 'string', required: true, desc: 'Current TOTP code to confirm disable' }]}
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/auth/check-2fa" desc="Check if the current session requires 2FA verification"
              response={`{ "requires2fa": true }`}
            />
            <EP method="GET" path="/api/user/notification-preferences" desc="Get notification preferences for the current user"
              response={`{ "email": true, "push": true, "sms": false, "whatsapp": false, "feeReminders": true, "assignmentReminders": true }`}
            />
            <EP method="PATCH" path="/api/user/notification-preferences" desc="Update notification preferences"
              body={[
                { name: 'email', type: 'boolean', desc: 'Email notifications' },
                { name: 'push', type: 'boolean', desc: 'Push notifications' },
                { name: 'sms', type: 'boolean', desc: 'SMS notifications' },
              ]}
              response={`{ "success": true }`}
            />
            <EP method="POST" path="/api/user/fcm-token" desc="Register a Firebase Cloud Messaging token for push notifications"
              body={[{ name: 'token', type: 'string', required: true, desc: 'FCM device token' }]}
              response={`{ "success": true }`}
            />
          </Section>

          {/* Academics */}
          <Section id="academics" icon={GraduationCap} title="Academics" color="bg-blue-600">
            <EP method="GET" path="/api/academics/departments" desc="List all departments"
              response={`[{ "id": "dep_abc", "name": "Computer Science", "code": "CS", "_count": { "courses": 12 } }]`}
              example={`curl ${BASE}/api/academics/departments ${AUTH}`}
            />
            <EP method="POST" path="/api/academics/departments" desc="Create a new department"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'Department name' },
                { name: 'code', type: 'string', required: true, desc: 'Unique code e.g. CS, BUS' },
                { name: 'description', type: 'string', desc: 'Optional description' },
              ]}
              response={`{ "id": "dep_xyz", "name": "Computer Science", "code": "CS", "tenantId": "tnt_abc" }`}
            />
            <EP method="GET" path="/api/academics/courses" desc="List all courses"
              params={[{ name: 'departmentId', type: 'string', desc: 'Filter by department' }]}
              response={`[{ "id": "crs_abc", "code": "CS301", "title": "Data Structures", "creditHours": 3, "level": 300, "department": { "name": "Computer Science" }, "_count": { "offerings": 2 } }]`}
              example={`curl "${BASE}/api/academics/courses?departmentId=dep_abc" ${AUTH}`}
            />
            <EP method="POST" path="/api/academics/courses" desc="Create a new course"
              body={[
                { name: 'departmentId', type: 'string', required: true, desc: 'Department ID' },
                { name: 'code', type: 'string', required: true, desc: 'Course code e.g. CS301' },
                { name: 'title', type: 'string', required: true, desc: 'Course title' },
                { name: 'description', type: 'string', desc: 'Course description' },
                { name: 'creditHours', type: 'number', desc: 'Default: 3' },
                { name: 'level', type: 'number', desc: '100, 200, 300, 400 etc.' },
              ]}
              response={`{ "id": "crs_new", "code": "CS301", "title": "Data Structures", "creditHours": 3 }`}
            />
            <EP method="GET" path="/api/academics/years" desc="List academic years"
              response={`[{ "id": "yr_abc", "name": "2025/2026", "startDate": "2025-09-01", "endDate": "2026-07-31", "isCurrent": true }]`}
            />
            <EP method="POST" path="/api/academics/years" desc="Create an academic year"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'e.g. 2025/2026' },
                { name: 'startDate', type: 'date', required: true, desc: 'ISO 8601' },
                { name: 'endDate', type: 'date', required: true, desc: 'ISO 8601' },
              ]}
              response={`{ "id": "yr_new", "name": "2025/2026", "isCurrent": false }`}
            />
            <EP method="GET" path="/api/academics/years/semesters" desc="List semesters (optionally filter by year)"
              params={[{ name: 'yearId', type: 'string', desc: 'Filter by academic year' }]}
              response={`[{ "id": "sem_abc", "name": "Semester 1", "academicYearId": "yr_abc", "startDate": "...", "endDate": "..." }]`}
            />
            <EP method="POST" path="/api/academics/years/semesters/:id/launch" desc="Launch a semester — marks it as current and activates all linked offerings"
              response={`{ "success": true, "semesterId": "sem_abc" }`}
            />
            <EP method="GET" path="/api/academics/active-semester" desc="Get the currently active semester and academic year"
              response={`{ "semester": { "id": "sem_abc", "name": "Semester 1", "startDate": "...", "endDate": "..." }, "academicYear": { "id": "yr_abc", "name": "2025/2026" } }`}
            />
            <EP method="GET" path="/api/academics/departments/:id" desc="Get a single department with its courses"
              response={`{ "id": "dep_abc", "name": "Computer Science", "code": "CS", "courses": [...] }`}
            />
            <EP method="PATCH" path="/api/academics/departments/:id" desc="Update a department"
              body={[
                { name: 'name', type: 'string', desc: 'Updated name' },
                { name: 'code', type: 'string', desc: 'Updated code' },
              ]}
              response={`{ "id": "dep_abc", "name": "Computer Science", "code": "CS" }`}
            />
            <EP method="DELETE" path="/api/academics/departments/:id" desc="Delete a department (must have no active courses)"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/academics/courses/:id" desc="Get a single course with offerings"
              response={`{ "id": "crs_abc", "code": "CS301", "title": "Data Structures", "offerings": [...] }`}
            />
            <EP method="PATCH" path="/api/academics/courses/:id" desc="Update a course"
              body={[
                { name: 'title', type: 'string', desc: 'Updated title' },
                { name: 'creditHours', type: 'number', desc: 'Credit hours' },
              ]}
              response={`{ "id": "crs_abc", "title": "Data Structures & Algorithms" }`}
            />
            <EP method="DELETE" path="/api/academics/courses/:id" desc="Delete a course"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/academics/offerings" desc="List course offerings (sections) with teacher and room info"
              params={[
                { name: 'semesterId', type: 'string', desc: 'Filter by semester' },
                { name: 'departmentId', type: 'string', desc: 'Filter by department' },
              ]}
              response={`[{ "id": "off_abc", "courseId": "crs_abc", "semesterId": "sem_abc", "teacherId": "usr_abc", "roomId": "rm_abc", "capacity": 40, "enrolled": 32, "schedule": [...], "course": { "code": "CS301", "title": "Data Structures" } }]`}
            />
            <EP method="POST" path="/api/academics/offerings" desc="Create a course offering (section)"
              body={[
                { name: 'courseId', type: 'string', required: true, desc: 'Course ID' },
                { name: 'semesterId', type: 'string', required: true, desc: 'Semester ID' },
                { name: 'teacherId', type: 'string', required: true, desc: 'Assigned teacher user ID' },
                { name: 'roomId', type: 'string', desc: 'Room ID' },
                { name: 'capacity', type: 'number', desc: 'Max student capacity' },
                { name: 'schedule', type: 'array', desc: 'Array of { day, startTime, endTime }' },
              ]}
              response={`{ "id": "off_new", "courseId": "crs_abc", "semesterId": "sem_abc", "capacity": 40 }`}
            />
            <EP method="PATCH" path="/api/academics/offerings/:id" desc="Update a course offering (teacher, room, schedule, capacity)"
              body={[
                { name: 'teacherId', type: 'string', desc: 'Reassign teacher' },
                { name: 'roomId', type: 'string', desc: 'Change room' },
                { name: 'capacity', type: 'number', desc: 'Update capacity' },
              ]}
              response={`{ "id": "off_abc", "capacity": 45 }`}
            />
            <EP method="DELETE" path="/api/academics/offerings/:id" desc="Delete a course offering (must have no enrollments)"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/academics/programs" desc="List academic programs"
              response={`[{ "id": "prog_abc", "name": "BSc Computer Science", "code": "BSC-CS", "durationYears": 4, "departmentId": "dep_abc", "_count": { "courses": 38, "students": 210 } }]`}
            />
            <EP method="POST" path="/api/academics/programs" desc="Create an academic program"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'Program name' },
                { name: 'code', type: 'string', required: true, desc: 'Unique code e.g. BSC-CS' },
                { name: 'departmentId', type: 'string', required: true, desc: 'Home department' },
                { name: 'durationYears', type: 'number', desc: 'Duration in years (default: 4)' },
              ]}
              response={`{ "id": "prog_new", "name": "BSc Computer Science", "code": "BSC-CS" }`}
            />
            <EP method="GET" path="/api/academics/programs/:id/courses" desc="List courses assigned to a program"
              response={`[{ "id": "crs_abc", "code": "CS301", "title": "Data Structures", "level": 300, "isRequired": true }]`}
            />
            <EP method="GET" path="/api/academics/rooms" desc="List rooms / venues"
              response={`[{ "id": "rm_abc", "name": "LH 101", "building": "Main Block", "capacity": 60, "type": "LECTURE_HALL" }]`}
            />
            <EP method="POST" path="/api/academics/rooms" desc="Create a room"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'Room name / number' },
                { name: 'building', type: 'string', desc: 'Building name' },
                { name: 'capacity', type: 'number', desc: 'Seating capacity' },
                { name: 'type', type: 'string', desc: 'LECTURE_HALL | LAB | SEMINAR | EXAM_HALL' },
              ]}
              response={`{ "id": "rm_new", "name": "LH 101", "capacity": 60 }`}
            />
            <EP method="GET" path="/api/academics/teachers" desc="List teachers/lecturers with their assigned offerings"
              response={`[{ "id": "usr_abc", "firstName": "Dr. Kwame", "lastName": "Asante", "email": "...", "offerings": [{ "id": "off_abc", "course": { "code": "CS301" } }] }]`}
            />
            <EP method="POST" path="/api/academics/enroll" desc="Manually enroll a student into a course offering (admin)"
              body={[
                { name: 'studentId', type: 'string', required: true, desc: 'Student user ID' },
                { name: 'offeringId', type: 'string', required: true, desc: 'Course offering ID' },
              ]}
              response={`{ "id": "enr_new", "studentId": "...", "offeringId": "...", "status": "ENROLLED" }`}
            />
            <EP method="GET" path="/api/academics/holidays" desc="List academic calendar holidays and events"
              response={`[{ "id": "hol_abc", "name": "Independence Day", "date": "2026-03-06", "type": "PUBLIC_HOLIDAY" }]`}
            />
            <EP method="POST" path="/api/academics/holidays" desc="Add a holiday or event to the academic calendar"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'Holiday/event name' },
                { name: 'date', type: 'date', required: true, desc: 'ISO 8601 date' },
                { name: 'type', type: 'string', desc: 'PUBLIC_HOLIDAY | ACADEMIC_HOLIDAY | EVENT' },
              ]}
              response={`{ "id": "hol_new", "name": "Independence Day", "date": "2026-03-06" }`}
            />
          </Section>

          {/* LMS */}
          {/* Admissions */}
          <Section id="admissions" icon={ClipboardCheck} title="Admissions" color="bg-indigo-600">
            <EP method="GET" path="/api/admin/admissions" desc="List all applications with status and document info"
              params={[
                { name: 'status', type: 'string', desc: 'PENDING | REVIEWING | ACCEPTED | REJECTED' },
                { name: 'search', type: 'string', desc: 'Search by applicant name or email' },
              ]}
              response={`[{ "id": "app_abc", "firstName": "Kwame", "lastName": "Mensah", "email": "...", "program": "BSc CS", "status": "REVIEWING", "submittedAt": "..." }]`}
            />
            <EP method="PATCH" path="/api/admin/admissions/:id" desc="Update application status (accept, reject, set to reviewing)"
              body={[
                { name: 'status', type: 'string', required: true, desc: 'ACCEPTED | REJECTED | REVIEWING' },
                { name: 'notes', type: 'string', desc: 'Internal admin notes' },
              ]}
              response={`{ "id": "app_abc", "status": "ACCEPTED" }`}
            />
            <EP method="POST" path="/api/admin/admissions/:id/convert" desc="Convert an accepted application into a student account"
              body={[
                { name: 'programId', type: 'string', required: true, desc: 'Enroll into this program' },
                { name: 'level', type: 'number', desc: 'Starting level (default: 100)' },
              ]}
              response={`{ "userId": "usr_new", "email": "kwame@school.edu", "role": "STUDENT" }`}
            />
            <EP method="GET" path="/api/admin/admissions/analytics" desc="Admissions funnel analytics"
              response={`{ "total": 340, "pending": 45, "reviewing": 28, "accepted": 210, "rejected": 57, "byProgram": [...] }`}
            />
            <EP method="GET" path="/api/apply/:slug" desc="Get public application form for a school (no auth required)"
              response={`{ "schoolName": "Ashesi University", "programs": [...], "deadline": "2026-06-30" }`}
            />
            <EP method="POST" path="/api/apply/:slug" desc="Submit a public admissions application"
              body={[
                { name: 'firstName', type: 'string', required: true, desc: 'Applicant first name' },
                { name: 'lastName', type: 'string', required: true, desc: 'Applicant last name' },
                { name: 'email', type: 'string', required: true, desc: 'Applicant email' },
                { name: 'programId', type: 'string', required: true, desc: 'Program applied for' },
                { name: 'documents', type: 'array', desc: 'Array of { type, url } uploaded documents' },
              ]}
              response={`{ "applicationId": "app_new", "trackingToken": "tkn_xxxx" }`}
            />
            <EP method="GET" path="/api/apply/:slug/track/:token" desc="Track application status publicly (no auth)"
              response={`{ "status": "REVIEWING", "submittedAt": "...", "lastUpdated": "..." }`}
            />
          </Section>

          <Section id="lms" icon={ClipboardCheck} title="LMS — Content, Assignments & Submissions" color="bg-violet-600">
            <EP method="GET" path="/api/lms/content" desc="List course materials for an offering"
              params={[{ name: 'courseOfferingId', type: 'string', desc: 'Filter by course offering' }]}
              response={`[{ "id": "cnt_abc", "title": "Week 1 Slides", "type": "PDF", "url": "https://...", "order": 1, "publishedAt": "..." }]`}
            />
            <EP method="POST" path="/api/lms/content" desc="Upload/add a course material"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'title', type: 'string', required: true, desc: 'Material title' },
                { name: 'type', type: 'string', required: true, desc: 'PDF | VIDEO | LINK | DOCUMENT | SCORM' },
                { name: 'url', type: 'string', required: true, desc: 'File or external URL' },
                { name: 'description', type: 'string', desc: 'Optional description' },
                { name: 'order', type: 'number', desc: 'Sort order (default: 0)' },
              ]}
              response={`{ "id": "cnt_new", "title": "Week 1 Slides", "type": "PDF", "url": "..." }`}
            />
            <EP method="PATCH" path="/api/lms/content/:id" desc="Update or publish a course material"
              body={[
                { name: 'title', type: 'string', desc: 'Updated title' },
                { name: 'publishedAt', type: 'date', desc: 'Set to publish (null to unpublish)' },
              ]}
              response={`{ "id": "cnt_abc", "title": "...", "publishedAt": "2026-01-15T08:00:00Z" }`}
            />
            <EP method="DELETE" path="/api/lms/content/:id" desc="Delete a course material"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/lms/assignments" desc="List assignments"
              params={[{ name: 'courseOfferingId', type: 'string', desc: 'Filter by offering' }]}
              response={`[{ "id": "asgn_abc", "title": "Lab Report 1", "dueDate": "2026-03-01", "maxScore": 100, "allowLate": false, "_count": { "submissions": 34 } }]`}
            />
            <EP method="POST" path="/api/lms/assignments" desc="Create an assignment"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'title', type: 'string', required: true, desc: 'Assignment title' },
                { name: 'description', type: 'string', desc: 'Brief description' },
                { name: 'instructions', type: 'string', desc: 'Detailed instructions' },
                { name: 'dueDate', type: 'date', required: true, desc: 'ISO 8601 deadline' },
                { name: 'maxScore', type: 'number', desc: 'Default: 100' },
                { name: 'allowLate', type: 'boolean', desc: 'Default: false' },
                { name: 'latePenaltyPct', type: 'number', desc: 'Penalty % per day late' },
              ]}
              response={`{ "id": "asgn_new", "title": "Lab Report 1", "dueDate": "2026-03-01T23:59:00Z" }`}
            />
            <EP method="PATCH" path="/api/lms/assignments/:id" desc="Update assignment details or grade a submission"
              body={[
                { name: 'title', type: 'string', desc: 'Updated title' },
                { name: 'dueDate', type: 'date', desc: 'Updated deadline' },
                { name: 'submissionId', type: 'string', desc: 'Submission ID to grade' },
                { name: 'score', type: 'number', desc: 'Score awarded' },
                { name: 'feedback', type: 'string', desc: 'Teacher feedback comment' },
              ]}
              response={`{ "id": "asgn_abc", "title": "Lab Report 1", "updatedAt": "..." }`}
            />
            <EP method="POST" path="/api/lms/submissions" desc="Submit or save draft for an assignment"
              body={[
                { name: 'assignmentId', type: 'string', required: true, desc: 'Assignment ID' },
                { name: 'content', type: 'string', required: true, desc: 'Submission text content or file URL' },
                { name: 'isDraft', type: 'boolean', desc: 'true = save as draft, false = final submit' },
              ]}
              response={`{ "id": "sub_abc", "status": "SUBMITTED", "submittedAt": "2026-02-28T22:10:00Z" }`}
            />
            <EP method="POST" path="/api/lms/submissions/:id/grade" desc="Grade a submission (teacher)"
              body={[
                { name: 'score', type: 'number', required: true, desc: 'Score awarded (0–maxScore)' },
                { name: 'feedback', type: 'string', desc: 'Written feedback comment' },
              ]}
              response={`{ "id": "sub_abc", "score": 84, "feedback": "Good work!", "gradedAt": "..." }`}
            />
            <EP method="POST" path="/api/lms/submissions/:id/plagiarism" desc="Run plagiarism check on a submission"
              response={`{ "similarity": 12.4, "sources": [{ "url": "...", "similarity": 8.1 }], "checkedAt": "..." }`}
            />
            <EP method="POST" path="/api/lms/submissions/:id/ai-feedback" desc="Generate AI feedback on a submission before teacher grades it"
              response={`{ "feedback": "Your argument in paragraph 2 is well-structured...", "suggestedScore": 78 }`}
            />
            <EP method="GET" path="/api/lms/progress" desc="Get current user's course progress across all enrolled offerings"
              response={`[{ "offeringId": "off_abc", "course": { "code": "CS301" }, "completedItems": 8, "totalItems": 14, "progressPct": 57 }]`}
            />
            <EP method="POST" path="/api/lms/content/:id/progress" desc="Mark a content item as viewed/completed"
              body={[{ name: 'completed', type: 'boolean', required: true, desc: 'true = mark complete' }]}
              response={`{ "success": true, "contentId": "cnt_abc", "completedAt": "..." }`}
            />
            <EP method="GET" path="/api/lms/leaderboard" desc="Get LMS gamification leaderboard for the active semester"
              params={[{ name: 'offeringId', type: 'string', desc: 'Scope to a specific course offering' }]}
              response={`[{ "rank": 1, "userId": "usr_abc", "firstName": "Ama", "lastName": "Boateng", "xp": 840, "badges": 5 }]`}
            />
            <EP method="GET" path="/api/lms/discussions/threads" desc="List discussion threads for a course offering"
              params={[{ name: 'offeringId', type: 'string', required: true, desc: 'Course offering ID' }]}
              response={`[{ "id": "th_abc", "title": "Week 3 Q&A", "authorId": "usr_abc", "postCount": 12, "isPinned": false, "createdAt": "..." }]`}
            />
            <EP method="POST" path="/api/lms/discussions/threads" desc="Create a discussion thread"
              body={[
                { name: 'offeringId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'title', type: 'string', required: true, desc: 'Thread title' },
                { name: 'body', type: 'string', required: true, desc: 'First post body' },
              ]}
              response={`{ "id": "th_new", "title": "Week 3 Q&A", "postCount": 1 }`}
            />
            <EP method="GET" path="/api/lms/discussions/:threadId/posts" desc="List posts in a discussion thread"
              response={`[{ "id": "post_abc", "body": "...", "author": { "firstName": "Kofi" }, "votes": 3, "isBestAnswer": false, "createdAt": "..." }]`}
            />
            <EP method="POST" path="/api/lms/discussions/:threadId/posts" desc="Reply to a discussion thread"
              body={[{ name: 'body', type: 'string', required: true, desc: 'Post body' }]}
              response={`{ "id": "post_new", "body": "...", "createdAt": "..." }`}
            />
            <EP method="POST" path="/api/lms/discussions/posts/:postId/vote" desc="Upvote or downvote a discussion post"
              body={[{ name: 'direction', type: 'string', required: true, desc: 'up | down | remove' }]}
              response={`{ "success": true, "votes": 4 }`}
            />
            <EP method="POST" path="/api/lms/discussions/posts/:postId/best-answer" desc="Mark a post as the best answer (teacher or thread author)"
              response={`{ "success": true, "postId": "post_abc" }`}
            />
            <EP method="GET" path="/api/lms/quizzes" desc="List quizzes for a course offering"
              params={[{ name: 'offeringId', type: 'string', desc: 'Filter by offering' }]}
              response={`[{ "id": "quiz_abc", "title": "Week 2 Quiz", "timeLimit": 20, "maxAttempts": 2, "publishedAt": "...", "myAttempts": 1, "myBestScore": 85 }]`}
            />
            <EP method="POST" path="/api/lms/quizzes" desc="Create a quiz (teacher)"
              body={[
                { name: 'offeringId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'title', type: 'string', required: true, desc: 'Quiz title' },
                { name: 'timeLimit', type: 'number', desc: 'Time limit in minutes (null = no limit)' },
                { name: 'maxAttempts', type: 'number', desc: 'Max attempts per student (default: 1)' },
                { name: 'shuffleQuestions', type: 'boolean', desc: 'Randomize question order (default: false)' },
              ]}
              response={`{ "id": "quiz_new", "title": "Week 2 Quiz", "status": "DRAFT" }`}
            />
            <EP method="GET" path="/api/lms/quizzes/:id/questions" desc="List questions for a quiz"
              response={`[{ "id": "q_abc", "body": "What is Big-O?", "type": "MCQ", "options": ["O(1)","O(n)","O(n²)","O(log n)"], "points": 5 }]`}
            />
            <EP method="POST" path="/api/lms/quizzes/:id/attempt" desc="Start or submit a quiz attempt"
              body={[
                { name: 'action', type: 'string', required: true, desc: 'start | submit' },
                { name: 'answers', type: 'array', desc: 'Array of { questionId, answer } — required for submit' },
              ]}
              response={`{ "attemptId": "att_abc", "score": 80, "passed": true, "completedAt": "..." }`}
            />
          </Section>

          {/* Live Classes */}
          <Section id="live-classes" icon={Video} title="Live Classes" color="bg-red-600">
            <EP method="GET" path="/api/live-classes" desc="List live class sessions"
              params={[{ name: 'courseOfferingId', type: 'string', desc: 'Filter by course offering' }]}
              response={`[{ "id": "lc_abc", "title": "CS301 Week 3", "scheduledAt": "2026-03-10T10:00:00Z", "durationMins": 60, "status": "SCHEDULED", "roomName": "...", "_count": { "participants": 12, "recordings": 1 } }]`}
            />
            <EP method="POST" path="/api/live-classes" desc="Schedule a new live class"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'title', type: 'string', required: true, desc: 'Class title' },
                { name: 'scheduledAt', type: 'datetime', required: true, desc: 'ISO 8601 start time' },
                { name: 'durationMins', type: 'number', desc: 'Duration in minutes (default: 60)' },
                { name: 'description', type: 'string', desc: 'Optional description' },
                { name: 'isRecorded', type: 'boolean', desc: 'Enable recording (default: false)' },
              ]}
              response={`{ "id": "lc_new", "roomName": "tnt_abc-lc1abc", "status": "SCHEDULED", "scheduledAt": "..." }`}
            />
            <EP method="PATCH" path="/api/live-classes/:id" desc="Update status (start/end/cancel) or details"
              body={[
                { name: 'status', type: 'string', desc: 'LIVE | ENDED | CANCELLED' },
                { name: 'title', type: 'string', desc: 'Updated title' },
              ]}
              response={`{ "id": "lc_abc", "status": "LIVE", "startedAt": "2026-03-10T10:01:00Z" }`}
            />
            <EP method="POST" path="/api/live-classes/token" desc="Generate a LiveKit room token for a participant"
              body={[
                { name: 'roomName', type: 'string', required: true, desc: 'LiveKit room name from class object' },
                { name: 'role', type: 'string', required: true, desc: 'host | participant' },
              ]}
              response={`{ "token": "eyJhbG..." }`}
            />
          </Section>

          {/* Finance */}
          <Section id="finance" icon={DollarSign} title="Finance" color="bg-green-600">
            <EP method="GET" path="/api/finance/fees" desc="List active fee structures"
              params={[{ name: 'semesterId', type: 'string', desc: 'Filter by semester' }]}
              response={`[{ "id": "fee_abc", "name": "Tuition Fee — Level 300", "amount": 3500, "dueDate": "2026-03-01", "isRecurring": true }]`}
            />
            <EP method="POST" path="/api/finance/fees" desc="Create a fee structure"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'Fee label' },
                { name: 'amount', type: 'number', required: true, desc: 'Fee amount' },
                { name: 'semesterId', type: 'string', desc: 'Applicable semester' },
                { name: 'level', type: 'number', desc: 'Student level (100–400)' },
                { name: 'dueDate', type: 'date', desc: 'Payment deadline' },
                { name: 'isRecurring', type: 'boolean', desc: 'Default: true' },
                { name: 'lateFee', type: 'number', desc: 'Late fee amount' },
                { name: 'lateFeeGraceDays', type: 'number', desc: 'Grace period before late fee' },
              ]}
              response={`{ "id": "fee_new", "name": "Tuition Fee — Level 300", "amount": 3500 }`}
            />
            <EP method="GET" path="/api/finance/scholarships" desc="List scholarship/bursary schemes"
              response={`[{ "id": "sch_abc", "name": "Merit Award", "amount": 1000, "type": "PARTIAL", "status": "ACTIVE" }]`}
            />
            <EP method="GET" path="/api/finance/invoices" desc="List invoices (admin view — all students)"
              params={[
                { name: 'studentId', type: 'string', desc: 'Filter by student' },
                { name: 'status', type: 'string', desc: 'PENDING | PAID | OVERDUE | PARTIAL' },
                { name: 'semesterId', type: 'string', desc: 'Filter by semester' },
              ]}
              response={`[{ "id": "inv_abc", "studentId": "usr_abc", "amount": 3500, "paid": 1000, "balance": 2500, "status": "PARTIAL", "dueDate": "2026-03-01", "student": { "firstName": "Ama", "lastName": "Boateng" } }]`}
            />
            <EP method="POST" path="/api/finance/invoices" desc="Create an invoice for a student"
              body={[
                { name: 'studentId', type: 'string', required: true, desc: 'Student user ID' },
                { name: 'feeId', type: 'string', required: true, desc: 'Fee structure ID' },
                { name: 'amount', type: 'number', desc: 'Override amount (defaults to fee amount)' },
                { name: 'dueDate', type: 'date', desc: 'Override due date' },
              ]}
              response={`{ "id": "inv_new", "amount": 3500, "status": "PENDING", "dueDate": "2026-03-01" }`}
            />
          </Section>

          {/* HR */}
          <Section id="hr" icon={Briefcase} title="HR — Employees, Leave & Payroll" color="bg-orange-600">
            <EP method="GET" path="/api/hr/employees" desc="List all employees with leave balances"
              params={[{ name: 'search', type: 'string', desc: 'Search by position or employee number' }]}
              response={`[{ "id": "emp_abc", "employeeNo": "EMP/2026/X1Y2", "position": "Lecturer", "employmentType": "FULL_TIME", "hireDate": "2024-01-15", "user": { "firstName": "Kofi", "lastName": "Mensah", "email": "kofi@school.edu" }, "leaveBalances": [...] }]`}
            />
            <EP method="POST" path="/api/hr/employees" desc="Create an employee record for a user"
              body={[
                { name: 'userId', type: 'string', required: true, desc: 'User ID of the employee' },
                { name: 'departmentId', type: 'string', required: true, desc: 'Department ID' },
                { name: 'position', type: 'string', required: true, desc: 'Job title / position' },
                { name: 'employmentType', type: 'string', desc: 'FULL_TIME | PART_TIME | CONTRACT' },
                { name: 'hireDate', type: 'date', required: true, desc: 'Start date' },
                { name: 'basicSalary', type: 'number', desc: 'Monthly base salary' },
              ]}
              response={`{ "id": "emp_new", "employeeNo": "EMP/2026/ABCD", "position": "Lecturer" }`}
            />
            <EP method="PATCH" path="/api/hr/employees/:id" desc="Update employee details or status"
              body={[
                { name: 'position', type: 'string', desc: 'Updated position' },
                { name: 'basicSalary', type: 'number', desc: 'Updated salary' },
                { name: 'status', type: 'string', desc: 'ACTIVE | INACTIVE | TERMINATED' },
              ]}
              response={`{ "id": "emp_abc", "position": "Senior Lecturer", "status": "ACTIVE" }`}
            />
            <EP method="GET" path="/api/hr/leave/types" desc="List available leave types (annual, sick, maternity…)"
              response={`[{ "id": "lt_abc", "name": "Annual Leave", "defaultDays": 21, "isPaid": true }]`}
            />
            <EP method="GET" path="/api/hr/leave/requests" desc="List leave requests"
              params={[
                { name: 'employeeId', type: 'string', desc: 'Filter by employee' },
                { name: 'status', type: 'string', desc: 'PENDING | APPROVED | REJECTED' },
              ]}
              response={`[{ "id": "lr_abc", "employeeId": "emp_abc", "leaveType": { "name": "Annual Leave" }, "startDate": "2026-06-01", "endDate": "2026-06-07", "days": 7, "status": "PENDING", "reason": "Family holiday" }]`}
            />
            <EP method="POST" path="/api/hr/leave/requests" desc="Submit a leave request"
              body={[
                { name: 'employeeId', type: 'string', required: true, desc: 'Employee ID' },
                { name: 'leaveTypeId', type: 'string', required: true, desc: 'Leave type ID' },
                { name: 'startDate', type: 'date', required: true, desc: 'First day of leave' },
                { name: 'endDate', type: 'date', required: true, desc: 'Last day of leave' },
                { name: 'reason', type: 'string', desc: 'Optional reason/notes' },
              ]}
              response={`{ "id": "lr_new", "days": 7, "status": "PENDING" }`}
            />
            <EP method="PATCH" path="/api/hr/leave/requests/:id" desc="Approve or reject a leave request"
              body={[
                { name: 'status', type: 'string', required: true, desc: 'APPROVED | REJECTED' },
                { name: 'notes', type: 'string', desc: 'Admin notes / reason for rejection' },
              ]}
              response={`{ "id": "lr_abc", "status": "APPROVED" }`}
            />
            <EP method="GET" path="/api/hr/payroll/periods" desc="List payroll periods with payslip counts"
              response={`[{ "id": "pp_abc", "name": "May 2026", "month": 5, "year": 2026, "status": "DRAFT", "_count": { "payslips": 42 } }]`}
            />
            <EP method="POST" path="/api/hr/payroll/periods" desc="Create a payroll period and auto-generate payslips"
              body={[
                { name: 'month', type: 'number', desc: '1–12 (default: current month)' },
                { name: 'year', type: 'number', desc: 'Default: current year' },
              ]}
              response={`{ "id": "pp_new", "name": "May 2026", "status": "DRAFT" }`}
            />
            <EP method="PATCH" path="/api/hr/payroll/periods/:id" desc="Process (finalise) a payroll period"
              body={[{ name: 'status', type: 'string', required: true, desc: 'PROCESSED | PAID' }]}
              response={`{ "id": "pp_abc", "status": "PROCESSED" }`}
            />
          </Section>

          {/* Users & Invites */}
          <Section id="users" icon={Users} title="Users & Invites" color="bg-indigo-600">
            <EP method="GET" path="/api/admin/users" desc="List all users (any role) with pagination"
              params={[
                { name: 'role', type: 'string', desc: 'STUDENT | TEACHER | STAFF | PARENT | ...' },
                { name: 'search', type: 'string', desc: 'Filter by name or email' },
                { name: 'page', type: 'number', desc: 'Page number (default: 1)' },
              ]}
              response={`{ "users": [{ "id": "...", "firstName": "Amara", "lastName": "Diallo", "email": "...", "role": "STUDENT", "status": "ACTIVE" }], "total": 342, "page": 1, "pages": 18 }`}
            />
            <EP method="POST" path="/api/admin/users" desc="Create a user directly (sends welcome email)"
              body={[
                { name: 'firstName', type: 'string', required: true, desc: 'First name' },
                { name: 'lastName', type: 'string', required: true, desc: 'Last name' },
                { name: 'email', type: 'string', required: true, desc: 'Email address' },
                { name: 'password', type: 'string', required: true, desc: 'Min 8 characters' },
                { name: 'role', type: 'string', required: true, desc: 'STUDENT | TEACHER | STAFF | ...' },
              ]}
              response={`{ "id": "usr_new", "firstName": "Fatima", "email": "fatima@school.edu", "role": "STUDENT", "status": "ACTIVE" }`}
            />
            <EP method="PATCH" path="/api/admin/users/:id" desc="Update user name, email, role or status"
              body={[
                { name: 'firstName', type: 'string', desc: 'Updated first name' },
                { name: 'lastName', type: 'string', desc: 'Updated last name' },
                { name: 'email', type: 'string', desc: 'New unique email' },
                { name: 'role', type: 'string', desc: 'New role' },
                { name: 'status', type: 'string', desc: 'ACTIVE | INACTIVE | SUSPENDED' },
              ]}
              response={`{ "id": "usr_abc", "email": "new@school.edu", "role": "TEACHER", "status": "ACTIVE" }`}
            />
            <EP method="DELETE" path="/api/admin/users/:id" desc="Delete a user (cannot delete your own account)"
              response={`{ "success": true }`}
            />
            <EP method="POST" path="/api/admin/users/:id/reset-password" desc="Admin resets a user's password (sends email)"
              body={[{ name: 'password', type: 'string', required: true, desc: 'New password, min 8 characters' }]}
              response={`{ "success": true }`}
            />
            <EP method="POST" path="/api/admin/users/import" desc="Bulk import users from CSV (max 500 rows)"
              body={[{ name: 'rows', type: 'array', required: true, desc: 'Array of { firstName, lastName, email, role, password? }' }]}
              response={`{ "created": 48, "skipped": 2, "results": [{ "row": 2, "email": "...", "status": "created" }, { "row": 5, "email": "...", "status": "skipped", "reason": "Email already exists" }] }`}
            />
            <EP method="GET" path="/api/admin/users/export" desc="Download all users as CSV file"
              params={[
                { name: 'role', type: 'string', desc: 'Filter by role' },
                { name: 'search', type: 'string', desc: 'Filter by name/email' },
              ]}
              response={`CSV file download (Content-Type: text/csv)`}
            />
            <EP method="GET" path="/api/invites" desc="List all active invitations"
              response={`[{ "id": "inv_abc", "email": "new@school.edu", "role": "STUDENT", "token": "...", "useCount": 0, "maxUses": 1, "expiresAt": "..." }]`}
            />
            <EP method="POST" path="/api/invites" desc="Create email-specific invite(s) or a shareable link"
              body={[
                { name: 'emails', type: 'string[]', desc: 'Specific emails (omit for shareable link)' },
                { name: 'role', type: 'string', required: true, desc: 'Role to assign on registration' },
                { name: 'expiresInDays', type: 'number', desc: 'Expiry in days (optional)' },
                { name: 'maxUses', type: 'number', desc: 'Max uses for shareable links (default: 100)' },
              ]}
              response={`{ "invites": [{ "id": "inv_abc", "token": "clxyz...", "email": "user@school.edu" }] }`}
            />
            <EP method="DELETE" path="/api/invites/:id" desc="Revoke an invitation"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/invite/:token" desc="Validate an invite token (public — no auth required)"
              response={`{ "schoolName": "Ashesi University", "role": "STUDENT", "email": "user@school.edu", "expiresAt": "..." }`}
            />
            <EP method="POST" path="/api/invite/:token/accept" desc="Accept invite and create account (public)"
              body={[
                { name: 'firstName', type: 'string', required: true, desc: 'First name' },
                { name: 'lastName', type: 'string', required: true, desc: 'Last name' },
                { name: 'password', type: 'string', required: true, desc: 'Min 8 characters' },
                { name: 'email', type: 'string', desc: 'Required for shareable links only' },
              ]}
              response={`{ "success": true, "tenantSlug": "ashesi", "email": "user@school.edu" }`}
            />
            <EP method="GET" path="/api/users/search" desc="Quick search users by name or email (typeahead)"
              params={[
                { name: 'q', type: 'string', required: true, desc: 'Search query (min 2 chars)' },
                { name: 'role', type: 'string', desc: 'Filter by role' },
              ]}
              response={`[{ "id": "usr_abc", "firstName": "Amara", "lastName": "Diallo", "email": "...", "role": "STUDENT" }]`}
            />
            <EP method="POST" path="/api/users/batch" desc="Fetch multiple users by ID in one request"
              body={[{ name: 'ids', type: 'string[]', required: true, desc: 'Array of user IDs (max 100)' }]}
              response={`[{ "id": "usr_abc", "firstName": "Amara", "lastName": "Diallo", "role": "STUDENT" }]`}
            />
          </Section>

          {/* Announcements */}
          <Section id="announcements" icon={Megaphone} title="Announcements" color="bg-pink-600">
            <EP method="GET" path="/api/announcements" desc="List announcements (published, non-expired)"
              params={[
                { name: 'audience', type: 'string', desc: 'ALL | STUDENTS | TEACHERS | STAFF | PARENTS' },
                { name: 'admin', type: 'boolean', desc: 'true = return all (admin view)' },
              ]}
              response={`[{ "id": "ann_abc", "title": "Semester Results Published", "body": "...", "audience": "STUDENTS", "isPinned": true, "publishedAt": "...", "author": { "firstName": "Dr", "lastName": "Mensah" } }]`}
            />
            <EP method="POST" path="/api/announcements" desc="Create and optionally publish an announcement"
              body={[
                { name: 'title', type: 'string', required: true, desc: 'Announcement title' },
                { name: 'body', type: 'string', required: true, desc: 'Announcement body (supports markdown)' },
                { name: 'audience', type: 'string', required: true, desc: 'ALL | STUDENTS | TEACHERS | STAFF | PARENTS' },
                { name: 'isPublished', type: 'boolean', desc: 'Publish immediately (default: false)' },
                { name: 'isPinned', type: 'boolean', desc: 'Pin to top (default: false)' },
                { name: 'expiresAt', type: 'date', desc: 'Auto-expire date' },
              ]}
              response={`{ "id": "ann_new", "title": "...", "isPublished": true, "publishedAt": "..." }`}
            />
            <EP method="PATCH" path="/api/announcements/:id" desc="Update or publish/unpublish announcement"
              body={[
                { name: 'title', type: 'string', desc: 'Updated title' },
                { name: 'isPublished', type: 'boolean', desc: 'Toggle published state' },
                { name: 'isPinned', type: 'boolean', desc: 'Toggle pinned state' },
              ]}
              response={`{ "id": "ann_abc", "isPublished": true }`}
            />
            <EP method="DELETE" path="/api/announcements/:id" desc="Delete an announcement"
              response={`{ "success": true }`}
            />
            <EP method="POST" path="/api/announcements/:id/read" desc="Mark an announcement as read for the current user"
              response={`{ "success": true }`}
            />
          </Section>

          {/* Chat */}
          <Section id="chat" icon={MessageSquare} title="Chat & Messaging" color="bg-teal-600">
            <EP method="GET" path="/api/chat/conversations" desc="List conversations for the current user"
              response={`[{ "id": "conv_abc", "name": null, "isGroup": false, "lastMessageAt": "...", "participants": [{ "userId": "...", "user": { "firstName": "...", "avatarUrl": null } }], "messages": [{ "content": "Hey!", "createdAt": "..." }] }]`}
            />
            <EP method="GET" path="/api/chat/conversations/:id/messages" desc="List messages in a conversation"
              response={`[{ "id": "msg_abc", "senderId": "usr_abc", "content": "Hello!", "createdAt": "...", "readReceipts": [] }]`}
            />
            <EP method="POST" path="/api/chat/conversations/:id/messages" desc="Send a message to a conversation"
              body={[{ name: 'content', type: 'string', required: true, desc: 'Message text' }]}
              response={`{ "id": "msg_new", "senderId": "usr_abc", "content": "Hello!", "createdAt": "..." }`}
            />
            <EP method="POST" path="/api/chat/dm" desc="Start or get a direct message conversation"
              body={[{ name: 'userId', type: 'string', required: true, desc: 'User ID to message' }]}
              response={`{ "id": "conv_abc", "isGroup": false, "participants": [...] }`}
            />
            <EP method="POST" path="/api/chat/upload" desc="Upload a file or image to share in chat (multipart)"
              body={[{ name: 'file', type: 'File (multipart)', required: true, desc: 'Image or document, max 5 MB' }]}
              response={`{ "url": "https://pub-xxx.r2.dev/chat/filename.jpg", "type": "image" }`}
            />
          </Section>

          {/* Notifications */}
          <Section id="notifications" icon={Bell} title="Notifications" color="bg-yellow-600">
            <EP method="GET" path="/api/notifications" desc="List notifications for current user (latest 50)"
              response={`[{ "id": "notif_abc", "type": "ANNOUNCEMENT", "title": "New announcement", "body": "...", "isRead": false, "createdAt": "..." }]`}
            />
            <EP method="POST" path="/api/notifications" desc="Mark notifications as read"
              body={[{ name: 'ids', type: 'string[]', desc: 'Specific notification IDs (omit to mark all read)' }]}
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/notifications/unread-count" desc="Get count of unread notifications for the current user"
              response={`{ "count": 7 }`}
            />
          </Section>

          {/* Student Life */}
          <Section id="student-life" icon={CalendarDays} title="Student Life" color="bg-cyan-600">
            <EP method="GET" path="/api/student-life/clubs" desc="List all clubs with membership status"
              response={`[{ "id": "club_abc", "name": "Robotics Club", "description": "...", "isMember": true, "_count": { "memberships": 24 } }]`}
            />
            <EP method="POST" path="/api/student-life/clubs/join" desc="Join or leave a club"
              body={[
                { name: 'clubId', type: 'string', required: true, desc: 'Club ID' },
                { name: 'action', type: 'string', required: true, desc: 'join | leave' },
              ]}
              response={`{ "success": true, "action": "join" }`}
            />
            <EP method="GET" path="/api/student-life/events" desc="List upcoming campus events with RSVP status"
              response={`[{ "id": "evt_abc", "title": "Tech Fair 2026", "startDate": "...", "endDate": "...", "location": "Main Hall", "myRsvp": "GOING", "_count": { "rsvps": 87 } }]`}
            />
            <EP method="POST" path="/api/student-life/events/rsvp" desc="RSVP to an event"
              body={[
                { name: 'eventId', type: 'string', required: true, desc: 'Event ID' },
                { name: 'status', type: 'string', required: true, desc: 'GOING | NOT_GOING | MAYBE' },
              ]}
              response={`{ "success": true, "status": "GOING" }`}
            />
            <EP method="GET" path="/api/student-life/maintenance" desc="List maintenance requests by the current user"
              response={`[{ "id": "maint_abc", "title": "Broken AC in Room 204", "status": "OPEN", "priority": "HIGH", "createdAt": "..." }]`}
            />
            <EP method="POST" path="/api/student-life/maintenance" desc="Submit a maintenance request"
              body={[
                { name: 'title', type: 'string', required: true, desc: 'Issue title' },
                { name: 'description', type: 'string', required: true, desc: 'Full description' },
                { name: 'location', type: 'string', required: true, desc: 'Building / room / location' },
                { name: 'priority', type: 'string', desc: 'LOW | MEDIUM | HIGH | URGENT' },
              ]}
              response={`{ "id": "maint_new", "title": "Broken AC in Room 204", "status": "OPEN" }`}
            />
            <EP method="PATCH" path="/api/admin/student-life/maintenance/:id" desc="Admin updates maintenance request status"
              body={[{ name: 'status', type: 'string', required: true, desc: 'IN_PROGRESS | RESOLVED | CLOSED' }]}
              response={`{ "id": "maint_abc", "status": "IN_PROGRESS" }`}
            />
          </Section>

          {/* AI */}
          <Section id="ai" icon={Brain} title="AI Features" color="bg-cyan-700">
            <EP method="POST" path="/api/ai/chat" desc="Streaming AI chat with Tera AI assistant"
              body={[{ name: 'messages', type: 'array', required: true, desc: 'OpenAI-style messages array: [{ role, content }]' }]}
              response={`Streaming text/plain response (chunked). Read stream incrementally.`}
              example={`curl -X POST ${BASE}/api/ai/chat ${AUTH} \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"What is my GPA?"}]}'`}
            />
            <EP method="POST" path="/api/ai/advisor" desc="AI academic advisor — course recommendations"
              body={[
                { name: 'studentId', type: 'string', required: true, desc: 'Student user ID' },
                { name: 'goal', type: 'string', desc: 'Student career/academic goal' },
              ]}
              response={`{ "advice": "Based on your GPA of 3.7 and interest in AI...", "recommendedCourses": ["CS401", "CS412"] }`}
            />
            <EP method="POST" path="/api/ai/essay-feedback" desc="AI feedback on a draft essay before teacher review"
              body={[
                { name: 'essay', type: 'string', required: true, desc: 'Essay text content' },
                { name: 'prompt', type: 'string', desc: 'Original assignment prompt' },
              ]}
              response={`{ "feedback": "Your introduction is strong... Consider expanding...", "score": 74 }`}
            />
            <EP method="POST" path="/api/ai/early-warning" desc="AI dropout risk analysis for a student"
              body={[{ name: 'studentId', type: 'string', required: true, desc: 'Student user ID' }]}
              response={`{ "riskLevel": "MEDIUM", "factors": ["3 missed classes", "Failing 2 courses"], "recommendation": "Schedule advisor meeting" }`}
            />
            <EP method="POST" path="/api/ai/search" desc="Natural language search across the platform"
              body={[{ name: 'query', type: 'string', required: true, desc: 'Natural language query' }]}
              response={`{ "results": [{ "type": "course", "title": "CS301", "url": "/admin/academics" }, ...] }`}
            />
          </Section>

          {/* Elections */}
          <Section id="elections" icon={Vote} title="Elections & Voting" color="bg-yellow-600">
            <EP method="GET" path="/api/elections" desc="List elections with candidates and vote status"
              response={`[{ "id": "elec_abc", "title": "SRC President 2026", "votingStart": "...", "votingEnd": "...", "myVote": null, "candidates": [{ "id": "cand_abc", "student": { "firstName": "Ama", "lastName": "Boateng" } }], "_count": { "votes": 234 } }]`}
            />
            <EP method="POST" path="/api/elections" desc="Create an election (admin)"
              body={[
                { name: 'title', type: 'string', required: true, desc: 'Election title' },
                { name: 'description', type: 'string', desc: 'Description' },
                { name: 'nominationsStart', type: 'datetime', required: true, desc: 'Nominations open' },
                { name: 'nominationsEnd', type: 'datetime', required: true, desc: 'Nominations close' },
                { name: 'votingStart', type: 'datetime', required: true, desc: 'Voting opens' },
                { name: 'votingEnd', type: 'datetime', required: true, desc: 'Voting closes' },
              ]}
              response={`{ "id": "elec_new", "title": "SRC President 2026", "status": "NOMINATIONS_OPEN" }`}
            />
            <EP method="POST" path="/api/elections/nominate" desc="Self-nominate as a candidate"
              body={[
                { name: 'electionId', type: 'string', required: true, desc: 'Election ID' },
                { name: 'manifesto', type: 'string', desc: 'Campaign manifesto text' },
              ]}
              response={`{ "id": "cand_new", "status": "PENDING" }`}
            />
            <EP method="POST" path="/api/elections/vote" desc="Cast a vote for a candidate"
              body={[
                { name: 'electionId', type: 'string', required: true, desc: 'Election ID' },
                { name: 'candidateId', type: 'string', required: true, desc: 'Candidate ID' },
              ]}
              response={`{ "success": true }`}
            />
            <EP method="PATCH" path="/api/admin/elections/candidates/:id" desc="Admin approves or rejects a candidate"
              body={[{ name: 'status', type: 'string', required: true, desc: 'APPROVED | REJECTED' }]}
              response={`{ "id": "cand_abc", "status": "APPROVED" }`}
            />
          </Section>

          {/* Career */}
          <Section id="career" icon={Briefcase} title="Career & Jobs" color="bg-emerald-600">
            <EP method="GET" path="/api/jobs" desc="List active job postings with application status"
              response={`[{ "id": "job_abc", "title": "Software Engineer Intern", "company": "TechCorp Ghana", "type": "INTERNSHIP", "deadline": "2026-06-30", "isActive": true, "myApplication": null, "_count": { "applications": 12 } }]`}
            />
            <EP method="POST" path="/api/jobs" desc="Post a new job/internship (admin)"
              body={[
                { name: 'title', type: 'string', required: true, desc: 'Job title' },
                { name: 'company', type: 'string', required: true, desc: 'Company name' },
                { name: 'description', type: 'string', required: true, desc: 'Job description' },
                { name: 'type', type: 'string', required: true, desc: 'FULL_TIME | PART_TIME | INTERNSHIP | VOLUNTEER' },
                { name: 'location', type: 'string', desc: 'Location or Remote' },
                { name: 'deadline', type: 'date', desc: 'Application deadline' },
              ]}
              response={`{ "id": "job_new", "title": "Software Engineer Intern", "isActive": true }`}
            />
            <EP method="POST" path="/api/jobs/apply" desc="Apply for a job"
              body={[
                { name: 'jobId', type: 'string', required: true, desc: 'Job ID' },
                { name: 'coverLetter', type: 'string', desc: 'Cover letter text' },
                { name: 'resumeUrl', type: 'string', desc: 'Link to uploaded resume' },
              ]}
              response={`{ "id": "app_new", "status": "PENDING" }`}
            />
          </Section>

          {/* Library */}
          <Section id="library" icon={Library} title="Digital Library" color="bg-slate-600">
            <EP method="GET" path="/api/library" desc="List books with borrow status for current user"
              response={`[{ "id": "book_abc", "title": "Introduction to Algorithms", "author": "Cormen et al.", "isbn": "978-0262033848", "availableCopies": 2, "totalCopies": 3, "myBorrow": null }]`}
            />
            <EP method="POST" path="/api/library" desc="Add a book to the library catalogue (admin)"
              body={[
                { name: 'title', type: 'string', required: true, desc: 'Book title' },
                { name: 'author', type: 'string', required: true, desc: 'Author(s)' },
                { name: 'isbn', type: 'string', desc: 'ISBN-13' },
                { name: 'totalCopies', type: 'number', desc: 'Number of physical copies' },
                { name: 'category', type: 'string', desc: 'e.g. Computer Science' },
              ]}
              response={`{ "id": "book_new", "title": "Introduction to Algorithms", "availableCopies": 3 }`}
            />
            <EP method="POST" path="/api/library/borrow" desc="Borrow a book"
              body={[
                { name: 'bookId', type: 'string', required: true, desc: 'Book ID' },
                { name: 'dueDate', type: 'date', desc: 'Return due date (default: 14 days)' },
              ]}
              response={`{ "id": "borrow_new", "dueDate": "2026-06-03", "status": "BORROWED" }`}
            />
          </Section>

          {/* Student Portal */}
          <Section id="student-portal" icon={Users} title="Student Portal" color="bg-sky-600">
            <EP method="GET" path="/api/student/profile" desc="Get the current student's profile and onboarding state"
              response={`{ "firstName": "Ama", "lastName": "Boateng", "studentId": "STU/2026/001", "program": "BSc CS", "level": 300, "cgpa": 3.72, "onboardingCompleted": true }`}
            />
            <EP method="PATCH" path="/api/student/profile" desc="Update student profile (bio, phone, avatar)"
              body={[
                { name: 'phone', type: 'string', desc: 'Phone number' },
                { name: 'bio', type: 'string', desc: 'Short bio' },
                { name: 'avatarUrl', type: 'string', desc: 'Profile photo URL' },
              ]}
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/student/timetable" desc="Get the student's weekly class timetable for the active semester"
              response={`[{ "offeringId": "off_abc", "course": { "code": "CS301", "title": "Data Structures" }, "day": "MONDAY", "startTime": "08:00", "endTime": "10:00", "room": { "name": "LH 101" }, "teacher": { "firstName": "Dr. Kwame" } }]`}
            />
            <EP method="GET" path="/api/student/calendar.ics" desc="Download timetable as iCalendar file (for Google/Apple Calendar import)"
              response={`iCalendar file (Content-Type: text/calendar; charset=utf-8)`}
            />
            <EP method="GET" path="/api/student/registration/catalog" desc="Browse course catalog for registration (with seat availability and prerequisites)"
              params={[
                { name: 'departmentId', type: 'string', desc: 'Filter by department' },
                { name: 'level', type: 'number', desc: 'Filter by course level' },
                { name: 'search', type: 'string', desc: 'Search by course code or title' },
              ]}
              response={`[{ "id": "off_abc", "course": { "code": "CS301", "title": "Data Structures", "creditHours": 3 }, "enrolled": 32, "capacity": 40, "seatsLeft": 8, "canRegister": true, "blockedReason": null }]`}
            />
            <EP method="GET" path="/api/student/registration" desc="Get the student's current course registrations for the active semester"
              response={`[{ "id": "enr_abc", "offeringId": "off_abc", "status": "ENROLLED", "course": { "code": "CS301" }, "enrolledAt": "..." }]`}
            />
            <EP method="POST" path="/api/student/registration" desc="Register for a course offering"
              body={[{ name: 'offeringId', type: 'string', required: true, desc: 'Course offering ID to register for' }]}
              response={`{ "id": "enr_new", "offeringId": "off_abc", "status": "ENROLLED" }`}
            />
            <EP method="DELETE" path="/api/student/registration" desc="Drop a course (within the add/drop window)"
              body={[{ name: 'offeringId', type: 'string', required: true, desc: 'Course offering ID to drop' }]}
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/student/enrolled-courses" desc="Get all courses the student is currently enrolled in"
              response={`[{ "id": "enr_abc", "course": { "code": "CS301", "title": "Data Structures" }, "teacher": { "firstName": "Dr. Kwame" }, "lmsUrl": "/student/courses/off_abc" }]`}
            />
            <EP method="GET" path="/api/student/payments" desc="Get the student's payment history and outstanding balances"
              response={`{ "outstanding": 2500, "invoices": [{ "id": "inv_abc", "amount": 3500, "paid": 1000, "balance": 2500, "status": "PARTIAL", "dueDate": "..." }], "payments": [...] }`}
            />
            <EP method="POST" path="/api/student/payments/initialize" desc="Initialize an online payment via Paystack or Stripe"
              body={[
                { name: 'invoiceId', type: 'string', required: true, desc: 'Invoice ID to pay' },
                { name: 'amount', type: 'number', required: true, desc: 'Amount to pay (partial or full)' },
                { name: 'gateway', type: 'string', desc: 'paystack | stripe | flutterwave (default: paystack)' },
              ]}
              response={`{ "authorizationUrl": "https://checkout.paystack.com/...", "reference": "TSM_REF_xxxx" }`}
            />
            <EP method="GET" path="/api/student/payments/verify" desc="Verify payment status after gateway redirect"
              params={[{ name: 'reference', type: 'string', required: true, desc: 'Payment reference from initialize' }]}
              response={`{ "success": true, "amount": 2500, "invoiceId": "inv_abc", "receiptUrl": "/student/payments/pay_abc/receipt" }`}
            />
            <EP method="GET" path="/api/student/payments/:id/receipt" desc="Download payment receipt as PDF"
              response={`PDF file (Content-Type: application/pdf)`}
            />
            <EP method="GET" path="/api/student/payment-plans" desc="Get the student's active installment payment plans"
              response={`[{ "id": "plan_abc", "invoiceId": "inv_abc", "installments": [{ "dueDate": "...", "amount": 1000, "status": "PAID" }] }]`}
            />
            <EP method="POST" path="/api/student/payment-plans" desc="Enroll in an installment payment plan"
              body={[
                { name: 'invoiceId', type: 'string', required: true, desc: 'Invoice to split into installments' },
                { name: 'installments', type: 'number', required: true, desc: 'Number of installments (2 or 3)' },
              ]}
              response={`{ "id": "plan_new", "installments": [{ "dueDate": "...", "amount": 1167 }] }`}
            />
            <EP method="GET" path="/api/student/scholarships" desc="Get scholarships and bursaries applied to the student's account"
              response={`[{ "id": "sch_abc", "name": "Merit Award", "amount": 1000, "status": "APPROVED", "appliedToInvoice": "inv_abc" }]`}
            />
            <EP method="POST" path="/api/student/manual-payments" desc="Submit proof of manual bank transfer payment"
              body={[
                { name: 'invoiceId', type: 'string', required: true, desc: 'Invoice being paid' },
                { name: 'amount', type: 'number', required: true, desc: 'Amount transferred' },
                { name: 'proofUrl', type: 'string', required: true, desc: 'URL of uploaded proof of payment' },
                { name: 'bankReference', type: 'string', desc: 'Bank transaction reference' },
              ]}
              response={`{ "id": "mp_new", "status": "PENDING_REVIEW" }`}
            />
            <EP method="GET" path="/api/student/transcript/pdf" desc="Download the student's unofficial transcript as PDF"
              response={`PDF file (Content-Type: application/pdf)`}
            />
            <EP method="GET" path="/api/student/id-card" desc="Get digital student ID card data (QR code, photo, details)"
              response={`{ "studentId": "STU/2026/001", "name": "Ama Boateng", "program": "BSc CS", "level": 300, "photoUrl": "...", "qrCode": "data:image/png;base64,..." }`}
            />
            <EP method="GET" path="/api/student/grade-appeals" desc="List the student's grade appeal submissions"
              response={`[{ "id": "appeal_abc", "courseCode": "CS301", "reason": "...", "status": "PENDING", "submittedAt": "..." }]`}
            />
            <EP method="POST" path="/api/student/grade-appeals" desc="Submit a grade appeal"
              body={[
                { name: 'gradeId', type: 'string', required: true, desc: 'Grade record ID to appeal' },
                { name: 'reason', type: 'string', required: true, desc: 'Grounds for appeal' },
                { name: 'evidence', type: 'string', desc: 'URL of supporting document' },
              ]}
              response={`{ "id": "appeal_new", "status": "PENDING" }`}
            />
            <EP method="GET" path="/api/student/counseling" desc="List counseling appointments booked by the student"
              response={`[{ "id": "appt_abc", "counselorName": "Ms. Adjoa", "scheduledAt": "...", "type": "MENTAL_HEALTH", "isAnonymous": false, "status": "CONFIRMED" }]`}
            />
            <EP method="POST" path="/api/student/counseling" desc="Book a counseling appointment"
              body={[
                { name: 'type', type: 'string', required: true, desc: 'MENTAL_HEALTH | ACADEMIC | CAREER' },
                { name: 'preferredDate', type: 'datetime', required: true, desc: 'Preferred appointment time' },
                { name: 'isAnonymous', type: 'boolean', desc: 'Book anonymously (default: false)' },
                { name: 'notes', type: 'string', desc: 'Brief notes for the counselor' },
              ]}
              response={`{ "id": "appt_new", "scheduledAt": "...", "status": "PENDING" }`}
            />
            <EP method="GET" path="/api/student/graduation" desc="Get graduation eligibility status and outstanding requirements"
              response={`{ "eligible": false, "creditEarned": 102, "creditRequired": 120, "outstandingCourses": ["CS401"], "outstandingFees": 0 }`}
            />
          </Section>

          {/* Staff Portal */}
          <Section id="staff-portal" icon={GraduationCap} title="Staff Portal" color="bg-teal-600">
            <EP method="GET" path="/api/staff/my-offerings" desc="List course offerings assigned to the current teacher for the active semester"
              response={`[{ "id": "off_abc", "course": { "code": "CS301", "title": "Data Structures" }, "enrolledCount": 32, "schedule": [...] }]`}
            />
            <EP method="GET" path="/api/staff/academic-grades" desc="List students and their grades for a course offering"
              params={[{ name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' }]}
              response={`[{ "studentId": "usr_abc", "firstName": "Ama", "lastName": "Boateng", "grade": { "caScore": 72, "examScore": 80, "totalScore": 78, "letterGrade": "B+", "gradePoint": 3.5, "remark": "PASS" } }]`}
            />
            <EP method="POST" path="/api/staff/academic-grades" desc="Enter or update CA and exam scores for a student"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'studentId', type: 'string', required: true, desc: 'Student user ID' },
                { name: 'caScore', type: 'number', desc: 'Continuous assessment score (0–100)' },
                { name: 'examScore', type: 'number', desc: 'Exam score (0–100)' },
              ]}
              response={`{ "id": "grade_abc", "caScore": 72, "examScore": 80, "letterGrade": "B+", "gradePoint": 3.5 }`}
            />
            <EP method="POST" path="/api/staff/academic-grades/publish" desc="Publish all grades for a course offering (makes results visible to students)"
              body={[{ name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' }]}
              response={`{ "published": 32, "studentsNotified": 32 }`}
            />
            <EP method="GET" path="/api/staff/attendance" desc="Get attendance records for a course offering"
              params={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'date', type: 'string', desc: 'Filter by date (ISO 8601)' },
              ]}
              response={`[{ "studentId": "usr_abc", "firstName": "Ama", "date": "2026-03-10", "status": "PRESENT" }]`}
            />
            <EP method="POST" path="/api/staff/attendance" desc="Submit attendance for a class session"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'date', type: 'date', required: true, desc: 'Class date' },
                { name: 'records', type: 'array', required: true, desc: 'Array of { studentId, status: PRESENT|ABSENT|LATE }' },
              ]}
              response={`{ "saved": 32 }`}
            />
            <EP method="GET" path="/api/staff/payslips" desc="Get the current teacher's payslips list"
              response={`[{ "id": "ps_abc", "month": 5, "year": 2026, "grossPay": 4200, "netPay": 3780, "status": "PAID" }]`}
            />
            <EP method="GET" path="/api/staff/payslip-pdf" desc="Download a payslip as PDF"
              params={[{ name: 'id', type: 'string', required: true, desc: 'Payslip ID' }]}
              response={`PDF file (Content-Type: application/pdf)`}
            />
            <EP method="GET" path="/api/staff/tax-certificate" desc="Download annual tax certificate as PDF"
              params={[{ name: 'year', type: 'number', required: true, desc: 'Tax year e.g. 2025' }]}
              response={`PDF file (Content-Type: application/pdf)`}
            />
            <EP method="GET" path="/api/staff/office-hours" desc="List the teacher's office hours slots"
              response={`[{ "id": "oh_abc", "dayOfWeek": "TUESDAY", "startTime": "14:00", "endTime": "16:00", "location": "Room 204", "bookings": [{ "studentId": "...", "status": "CONFIRMED" }] }]`}
            />
            <EP method="POST" path="/api/staff/office-hours" desc="Create an office hours slot"
              body={[
                { name: 'dayOfWeek', type: 'string', required: true, desc: 'MONDAY–FRIDAY' },
                { name: 'startTime', type: 'string', required: true, desc: '24h time e.g. 14:00' },
                { name: 'endTime', type: 'string', required: true, desc: '24h time e.g. 16:00' },
                { name: 'location', type: 'string', desc: 'Room or virtual link' },
                { name: 'maxBookings', type: 'number', desc: 'Max concurrent bookings per slot (default: 1)' },
              ]}
              response={`{ "id": "oh_new", "dayOfWeek": "TUESDAY", "startTime": "14:00" }`}
            />
            <EP method="GET" path="/api/staff/grades-export" desc="Export grade sheet for a course offering as CSV/Excel"
              params={[{ name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' }]}
              response={`CSV/Excel file download`}
            />
            <EP method="POST" path="/api/staff/grades-import" desc="Import grades from CSV/Excel file"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'file', type: 'File (multipart)', required: true, desc: 'CSV or Excel file with grades' },
              ]}
              response={`{ "imported": 30, "skipped": 2, "errors": [] }`}
            />
            <EP method="GET" path="/api/staff/resit-grades" desc="List students eligible for resit and their resit grade entries"
              params={[{ name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' }]}
              response={`[{ "studentId": "...", "firstName": "Kofi", "originalGrade": "F", "resitScore": null }]`}
            />
            <EP method="POST" path="/api/staff/resit-grades/submit" desc="Submit resit scores for eligible students"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'grades', type: 'array', required: true, desc: 'Array of { studentId, resitScore }' },
              ]}
              response={`{ "submitted": 5 }`}
            />
          </Section>

          {/* Admin Ops */}
          <Section id="admin-ops" icon={Settings} title="Admin Operations" color="bg-orange-600">
            <EP method="GET" path="/api/admin/dashboard-stats" desc="Get admin dashboard summary stats (students, revenue, enrollments, staff)"
              response={`{ "totalStudents": 1240, "activeStaff": 87, "revenueThisMonth": 42500, "pendingApplications": 23, "activeOfferings": 64 }`}
            />
            <EP method="GET" path="/api/admin/analytics" desc="Full analytics data — enrollment trends, revenue, attendance, pass rates"
              params={[{ name: 'from', type: 'date', desc: 'Start date' }, { name: 'to', type: 'date', desc: 'End date' }]}
              response={`{ "enrollmentTrend": [...], "revenueTrend": [...], "passRate": 78.4, "attendanceRate": 83.2 }`}
            />
            <EP method="GET" path="/api/admin/enrollments" desc="List all enrollments across all offerings"
              params={[
                { name: 'offeringId', type: 'string', desc: 'Filter by offering' },
                { name: 'status', type: 'string', desc: 'ENROLLED | DROPPED | COMPLETED' },
              ]}
              response={`[{ "id": "enr_abc", "studentId": "...", "offeringId": "...", "status": "ENROLLED", "student": { "firstName": "Ama" }, "offering": { "course": { "code": "CS301" } } }]`}
            />
            <EP method="GET" path="/api/admin/enrollments/pending" desc="List students on waitlists (pending enrollment)"
              response={`[{ "studentId": "...", "offeringId": "...", "waitlistPosition": 2, "joinedAt": "..." }]`}
            />
            <EP method="GET" path="/api/admin/exams" desc="List all scheduled exams"
              params={[{ name: 'semesterId', type: 'string', desc: 'Filter by semester' }]}
              response={`[{ "id": "exam_abc", "courseOfferingId": "...", "date": "2026-05-12", "startTime": "09:00", "duration": 180, "room": { "name": "EH 1" }, "invigilators": [...] }]`}
            />
            <EP method="POST" path="/api/admin/exams" desc="Schedule an exam"
              body={[
                { name: 'courseOfferingId', type: 'string', required: true, desc: 'Course offering ID' },
                { name: 'date', type: 'date', required: true, desc: 'Exam date' },
                { name: 'startTime', type: 'string', required: true, desc: '24h time e.g. 09:00' },
                { name: 'duration', type: 'number', required: true, desc: 'Duration in minutes' },
                { name: 'roomId', type: 'string', required: true, desc: 'Exam room' },
              ]}
              response={`{ "id": "exam_new", "date": "2026-05-12", "startTime": "09:00" }`}
            />
            <EP method="POST" path="/api/admin/exams/:id/invigilators" desc="Assign invigilators to an exam"
              body={[{ name: 'staffIds', type: 'string[]', required: true, desc: 'Staff user IDs to assign' }]}
              response={`{ "assigned": 3 }`}
            />
            <EP method="GET" path="/api/admin/campuses" desc="List campuses (multi-campus institutions)"
              response={`[{ "id": "cam_abc", "name": "Main Campus", "city": "Accra", "country": "Ghana", "_count": { "students": 800 } }]`}
            />
            <EP method="POST" path="/api/admin/campuses" desc="Create a campus"
              body={[
                { name: 'name', type: 'string', required: true, desc: 'Campus name' },
                { name: 'city', type: 'string', required: true, desc: 'City' },
                { name: 'country', type: 'string', required: true, desc: 'Country' },
              ]}
              response={`{ "id": "cam_new", "name": "Main Campus" }`}
            />
            <EP method="GET" path="/api/admin/faculties" desc="List faculties"
              response={`[{ "id": "fac_abc", "name": "Faculty of Science", "_count": { "departments": 4 } }]`}
            />
            <EP method="POST" path="/api/admin/faculties" desc="Create a faculty"
              body={[{ name: 'name', type: 'string', required: true, desc: 'Faculty name' }]}
              response={`{ "id": "fac_new", "name": "Faculty of Science" }`}
            />
            <EP method="GET" path="/api/admin/faculties/:id/departments" desc="List departments within a faculty"
              response={`[{ "id": "dep_abc", "name": "Computer Science", "code": "CS" }]`}
            />
            <EP method="GET" path="/api/admin/grade-sheets" desc="List grade sheets (summaries per course per semester)"
              params={[{ name: 'semesterId', type: 'string', desc: 'Filter by semester' }]}
              response={`[{ "offeringId": "...", "courseCode": "CS301", "totalStudents": 32, "submitted": 32, "published": true }]`}
            />
            <EP method="GET" path="/api/admin/resits" desc="List students eligible for resit exams"
              params={[{ name: 'semesterId', type: 'string', desc: 'Filter by semester' }]}
              response={`[{ "studentId": "...", "courseCode": "CS301", "originalScore": 38, "eligible": true }]`}
            />
            <EP method="POST" path="/api/admin/resits/publish" desc="Publish resit results (makes resit grades visible to students)"
              body={[{ name: 'semesterId', type: 'string', required: true, desc: 'Semester to publish resit results for' }]}
              response={`{ "published": 18 }`}
            />
            <EP method="GET" path="/api/admin/graduation" desc="List students who have applied for graduation"
              response={`[{ "studentId": "...", "name": "Ama Boateng", "program": "BSc CS", "cgpa": 3.71, "creditEarned": 120, "status": "PENDING" }]`}
            />
            <EP method="POST" path="/api/admin/students/promote" desc="Bulk-promote eligible students to the next level at end of academic year"
              body={[
                { name: 'semesterId', type: 'string', required: true, desc: 'Completed semester ID' },
                { name: 'studentIds', type: 'string[]', desc: 'Specific student IDs (omit to promote all eligible)' },
              ]}
              response={`{ "promoted": 210, "failed": 14, "deferred": 8 }`}
            />
            <EP method="GET" path="/api/admin/students/promotion-preview" desc="Preview which students will be promoted before committing"
              params={[{ name: 'semesterId', type: 'string', required: true, desc: 'Semester to evaluate' }]}
              response={`{ "eligible": [{ "studentId": "...", "name": "Ama Boateng", "currentLevel": 200, "toLevel": 300 }], "failed": [...] }`}
            />
            <EP method="GET" path="/api/admin/manual-payments" desc="List pending manual payment proofs awaiting review"
              response={`[{ "id": "mp_abc", "studentId": "...", "amount": 2500, "proofUrl": "...", "status": "PENDING_REVIEW", "submittedAt": "..." }]`}
            />
            <EP method="PATCH" path="/api/admin/manual-payments/:id" desc="Approve or reject a manual payment proof"
              body={[
                { name: 'status', type: 'string', required: true, desc: 'APPROVED | REJECTED' },
                { name: 'notes', type: 'string', desc: 'Reason for rejection' },
              ]}
              response={`{ "id": "mp_abc", "status": "APPROVED" }`}
            />
            <EP method="GET" path="/api/admin/roles" desc="List custom roles and their permissions"
              response={`[{ "id": "role_abc", "name": "Registrar", "permissions": ["students.read","students.write","enrollments.read"] }]`}
            />
            <EP method="GET" path="/api/admin/notifications-settings" desc="Get school-wide notification settings"
              response={`{ "feeReminderDays": [7,3,1], "emailEnabled": true, "smsEnabled": false, "whatsappEnabled": true }`}
            />
            <EP method="PATCH" path="/api/admin/notifications-settings" desc="Update notification settings"
              body={[
                { name: 'feeReminderDays', type: 'number[]', desc: 'Days before due date to send reminders' },
                { name: 'smsEnabled', type: 'boolean', desc: 'Enable SMS notifications school-wide' },
              ]}
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/admin/security" desc="Get security settings (IP whitelist, 2FA enforcement)"
              response={`{ "twoFactorRequired": true, "ipWhitelist": ["192.168.1.0/24"], "sessionTimeout": 480 }`}
            />
            <EP method="PATCH" path="/api/admin/security" desc="Update security settings"
              body={[
                { name: 'twoFactorRequired', type: 'boolean', desc: 'Require 2FA for all staff/admin' },
                { name: 'ipWhitelist', type: 'string[]', desc: 'CIDR blocks to whitelist for admin portal' },
                { name: 'sessionTimeout', type: 'number', desc: 'Session timeout in minutes' },
              ]}
              response={`{ "success": true }`}
            />
            <EP method="POST" path="/api/admin/finance/reminders" desc="Manually trigger fee reminder emails/SMS for overdue invoices"
              body={[{ name: 'semesterId', type: 'string', desc: 'Scope to a specific semester (default: active)' }]}
              response={`{ "sent": 43 }`}
            />
          </Section>

          {/* Admin Settings */}
          <Section id="admin" icon={Settings} title="Admin Settings & API Keys" color="bg-gray-700">
            <EP method="GET" path="/api/admin/settings" desc="Get current school settings (profile, branding, security)"
              response={`{ "name": "Ashesi University", "logoUrl": "...", "primaryColor": "#3b5bff", "timezone": "Africa/Accra", "twoFactorRequired": false }`}
            />
            <EP method="PATCH" path="/api/admin/settings" desc="Update school settings"
              body={[
                { name: 'name', type: 'string', desc: 'School name' },
                { name: 'logoUrl', type: 'string', desc: 'Logo URL from upload endpoint' },
                { name: 'primaryColor', type: 'string', desc: 'Hex color for branding' },
                { name: 'timezone', type: 'string', desc: 'IANA timezone e.g. Africa/Accra' },
              ]}
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/admin/api-keys" desc="List API keys for this tenant"
              response={`[{ "id": "key_abc", "name": "Production Key", "prefix": "tsk_live_xxxx", "createdAt": "...", "lastUsedAt": "..." }]`}
            />
            <EP method="POST" path="/api/admin/api-keys" desc="Generate a new API key"
              body={[{ name: 'name', type: 'string', required: true, desc: 'Key label e.g. Production Key' }]}
              response={`{ "id": "key_new", "name": "Production Key", "key": "tsk_live_xxxxxxxxxxxxxxxx" }`}
            />
            <EP method="DELETE" path="/api/admin/api-keys/:id" desc="Revoke an API key"
              response={`{ "success": true }`}
            />
            <EP method="GET" path="/api/admin/webhooks" desc="List configured webhook endpoints"
              response={`[{ "id": "wh_abc", "url": "https://yourapp.com/hooks/tera", "events": ["invoice.paid","enrollment.created"], "isActive": true }]`}
            />
            <EP method="POST" path="/api/admin/webhooks" desc="Register a new webhook"
              body={[
                { name: 'url', type: 'string', required: true, desc: 'HTTPS endpoint URL' },
                { name: 'events', type: 'string[]', required: true, desc: 'Event types to subscribe to' },
              ]}
              response={`{ "id": "wh_new", "url": "...", "secret": "whsec_xxxxxxxx" }`}
            />
          </Section>

          {/* Billing & GDPR */}
          <Section id="billing" icon={DollarSign} title="Billing & GDPR" color="bg-blue-700">
            <EP method="GET" path="/api/admin/billing" desc="Get current subscription plan, usage stats and billing history"
              response={`{ "plan": "PRO", "status": "ACTIVE", "currentPeriodEnd": "2026-06-01", "studentCount": 842, "studentCap": 3000, "storageUsedGb": 24.3, "storageCap": 100 }`}
            />
            <EP method="POST" path="/api/billing/checkout" desc="Initiate a plan upgrade or new subscription checkout"
              body={[
                { name: 'plan', type: 'string', required: true, desc: 'STARTER | PRO | ENTERPRISE | UNIVERSITY' },
                { name: 'billing', type: 'string', required: true, desc: 'monthly | annual' },
                { name: 'gateway', type: 'string', desc: 'paystack | stripe (default: stripe)' },
              ]}
              response={`{ "checkoutUrl": "https://checkout.stripe.com/..." }`}
            />
            <EP method="POST" path="/api/billing/activate" desc="Activate a plan after successful payment (called by webhook internally)"
              body={[{ name: 'reference', type: 'string', required: true, desc: 'Payment reference from checkout' }]}
              response={`{ "success": true, "plan": "PRO", "activatedAt": "..." }`}
            />
            <EP method="GET" path="/api/admin/gdpr/export" desc="Export all personal data for a specific user (GDPR right of access)"
              params={[{ name: 'userId', type: 'string', required: true, desc: 'User whose data to export' }]}
              response={`ZIP file download containing JSON exports of all personal data`}
            />
            <EP method="DELETE" path="/api/admin/gdpr/erase" desc="Erase a user's personal data (GDPR right to erasure / right to be forgotten)"
              body={[
                { name: 'userId', type: 'string', required: true, desc: 'User to erase' },
                { name: 'confirm', type: 'boolean', required: true, desc: 'Must be true to confirm irreversible action' },
              ]}
              response={`{ "success": true, "erasedAt": "..." }`}
            />
            <EP method="POST" path="/api/webhooks/paystack" desc="Paystack payment webhook (verified by X-Paystack-Signature header)"
              response={`{ "received": true }`}
            />
            <EP method="POST" path="/api/webhooks/stripe" desc="Stripe payment webhook (verified by Stripe-Signature header)"
              response={`{ "received": true }`}
            />
          </Section>

          {/* Upload */}
          <Section id="upload" icon={Upload} title="File Upload" color="bg-fuchsia-600">
            <EP method="POST" path="/api/upload" desc="Upload a file to Cloudflare R2 storage"
              body={[{ name: 'file', type: 'File (multipart)', required: true, desc: 'Image or document, max 5 MB. Allowed: image/*, application/pdf' }]}
              response={`{ "url": "https://pub-xxx.r2.dev/uploads/filename.jpg", "key": "uploads/filename.jpg" }`}
              example={`curl -X POST ${BASE}/api/upload ${AUTH} \\
  -F "file=@logo.png"`}
            />
          </Section>

          {/* Public API v1 */}
          <Section id="v1" icon={Code2} title="Public REST API — /api/v1" color="bg-blue-700">
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex gap-3 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">These endpoints use <strong>Bearer API key</strong> auth. Available on Pro and above plans.</p>
            </div>
            <EP method="GET" path="/api/v1/students" desc="List active students (bearer token)"
              params={[
                { name: 'page', type: 'number', desc: 'Page number (default: 1)' },
                { name: 'limit', type: 'number', desc: 'Per page, max 100 (default: 50)' },
                { name: 'search', type: 'string', desc: 'Name or email filter' },
              ]}
              response={`{ "data": [{ "id": "...", "firstName": "Amara", "lastName": "Diallo", "email": "...", "status": "ACTIVE" }], "total": 342, "page": 1, "pages": 7 }`}
              example={`curl "${BASE}/api/v1/students?page=1&limit=50" \\
  -H "Authorization: Bearer tsk_live_xxxx"`}
            />
            <EP method="GET" path="/api/v1/enrollments" desc="List enrollments (bearer token)"
              params={[
                { name: 'studentId', type: 'string', desc: 'Filter by student' },
                { name: 'status', type: 'string', desc: 'ENROLLED | DROPPED | COMPLETED' },
                { name: 'page', type: 'number', desc: 'Page number' },
              ]}
              response={`{ "data": [{ "id": "...", "studentId": "...", "courseOfferingId": "...", "status": "ENROLLED", "enrolledAt": "...", "courseOffering": { "course": { "code": "CS301", "title": "Data Structures" } } }], "total": 1240 }`}
              example={`curl "${BASE}/api/v1/enrollments?studentId=usr_abc" \\
  -H "Authorization: Bearer tsk_live_xxxx"`}
            />
          </Section>

          {/* Webhooks */}
          <section id="webhooks" className="scroll-mt-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center"><Webhook className="w-5 h-5 text-white" /></div>
              Webhooks
            </h2>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Receive real-time event notifications sent as HTTP POST to your endpoint. Configure in <strong className="text-gray-900 dark:text-white">Admin → Settings → Webhooks</strong>.</p>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">All event types</p>
                <div className="grid sm:grid-cols-3 gap-1.5">
                  {['user.created','user.updated','user.deleted','enrollment.created','enrollment.dropped','invoice.created','invoice.paid','invoice.overdue','grade.published','assignment.submitted','announcement.created','leave.approved','leave.rejected','election.started','election.ended'].map(e => (
                    <code key={e} className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">{e}</code>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Payload format</p>
                <Code lang="json">{`{
  "id": "evt_abc123",
  "event": "invoice.paid",
  "tenantId": "tnt_xyz",
  "timestamp": "2026-05-20T14:32:00Z",
  "data": {
    "invoiceId": "inv_abc",
    "studentId": "usr_abc",
    "amount": 2500.00,
    "paidAt": "2026-05-20T14:32:00Z"
  }
}`}</Code>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Signature verification</p>
                <Code lang="typescript">{`import crypto from 'crypto'

export function verifyWebhook(rawBody: string, sig: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

// In your webhook handler:
const sig = request.headers.get('X-Tera-Signature') ?? ''
if (!verifyWebhook(await request.text(), sig, process.env.WEBHOOK_SECRET!)) {
  return new Response('Unauthorized', { status: 401 })
}`}</Code>
              </div>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="scroll-mt-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
              Rate Limits
            </h2>
            <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>{['Plan','Req / min','Req / day','Burst'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
                  {[['Pro','60','10,000','120'],['Enterprise','300','100,000','600'],['University','1,000','Unlimited','2,000']].map(([plan,...vals]) => (
                    <tr key={plan}>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{plan}</td>
                      {vals.map(v => <td key={v} className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-sm">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">Response headers: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">X-RateLimit-Limit</code>, <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">X-RateLimit-Remaining</code>, <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">X-RateLimit-Reset</code></p>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Ready to integrate?</h3>
            <p className="text-blue-100 mb-6">Generate your API key from admin settings and start building in minutes.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/register" className="px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors">Start Free Trial</Link>
              <Link href="/contact" className="px-5 py-2.5 bg-blue-700/50 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2">Talk to Sales <ExternalLink className="w-3.5 h-3.5" /></Link>
            </div>
          </div>

          </div>
        </div>
      </div>

    </DocsFilter.Provider>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

    </div>
  )
}
