'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Code2, Webhook, ChevronDown, Copy, Check,
  Terminal, Key, Shield, Zap, AlertCircle, CheckCircle2,
  Users, GraduationCap, DollarSign, FileText, BarChart2,
  ExternalLink, Video, Briefcase, MessageSquare, Bell,
  Brain, Vote, Library, Upload, Settings, Building,
  CalendarDays, ClipboardCheck, UserPlus, Megaphone,
} from 'lucide-react'

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
      {copied ? <><Check className="w-3 h-3 text-green-400" /><span className={copied && !light ? 'text-green-400' : ''}>Copied</span></> : <><Copy className="w-3 h-3" />Copy</>}
    </button>
  )
}

function Code({ children, lang = 'bash' }: { children: string; lang?: string }) {
  const langLabel: Record<string, string> = {
    bash: 'Terminal', json: 'JSON', typescript: 'TypeScript', text: 'URL', javascript: 'JavaScript',
  }
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl shadow-black/20 mt-3 border border-white/5">
      {/* macOS window chrome */}
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
      {/* Code body */}
      <div className="bg-[#141416] px-5 py-4 overflow-x-auto">
        <pre className="text-[13px] font-mono text-gray-300 leading-6 whitespace-pre">{children}</pre>
      </div>
    </div>
  )
}

function Badge({ method }: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' }) {
  const c = {
    GET:    'bg-blue-50   dark:bg-blue-950   text-blue-600   dark:text-blue-400   border-blue-200   dark:border-blue-900',
    POST:   'bg-green-50  dark:bg-green-950  text-green-700  dark:text-green-400  border-green-200  dark:border-green-900',
    PATCH:  'bg-amber-50  dark:bg-amber-950  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-900',
    PUT:    'bg-amber-50  dark:bg-amber-950  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-900',
    DELETE: 'bg-red-50    dark:bg-red-950    text-red-600    dark:text-red-400    border-red-200    dark:border-red-900',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border tracking-wider ${c[method]}`}>
      {method}
    </span>
  )
}

type Param = { name: string; type: string; required?: boolean; desc: string }

function EP({ method, path, desc, params, body, response, example }: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  path: string; desc: string
  params?: Param[]; body?: Param[]
  response: string; example?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-200 ${open ? 'border-gray-300 dark:border-gray-700 shadow-md shadow-black/5' : 'border-gray-200 dark:border-gray-800'}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors text-left">
        <Badge method={method} />
        <span className="font-mono text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">{path}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:block shrink-0 max-w-[200px] truncate">{desc}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${open ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
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
                  <div key={p.name} className="flex items-start gap-4 px-4 py-2.5 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                  <div key={p.name} className="flex items-start gap-4 px-4 py-2.5 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{children}</p>
}

function Section({ id, icon: Icon, title, color, children }: {
  id: string; icon: React.ComponentType<{ className?: string }>;
  title: string; color: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
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
  { label: 'Overview', href: '#overview', icon: BookOpen },
  { label: 'Authentication', href: '#auth', icon: Key },
  { label: 'Auth & Register', href: '#auth-endpoints', icon: Shield },
  { label: 'Academics', href: '#academics', icon: GraduationCap },
  { label: 'LMS', href: '#lms', icon: ClipboardCheck },
  { label: 'Live Classes', href: '#live-classes', icon: Video },
  { label: 'Finance', href: '#finance', icon: DollarSign },
  { label: 'HR', href: '#hr', icon: Briefcase },
  { label: 'Users & Invites', href: '#users', icon: Users },
  { label: 'Announcements', href: '#announcements', icon: Megaphone },
  { label: 'Chat', href: '#chat', icon: MessageSquare },
  { label: 'Notifications', href: '#notifications', icon: Bell },
  { label: 'Student Life', href: '#student-life', icon: CalendarDays },
  { label: 'AI Features', href: '#ai', icon: Brain },
  { label: 'Elections', href: '#elections', icon: Vote },
  { label: 'Career & Jobs', href: '#career', icon: Briefcase },
  { label: 'Library', href: '#library', icon: Library },
  { label: 'Admin Settings', href: '#admin', icon: Settings },
  { label: 'File Upload', href: '#upload', icon: Upload },
  { label: 'Public API v1', href: '#v1', icon: Code2 },
  { label: 'Webhooks', href: '#webhooks', icon: Webhook },
  { label: 'Rate Limits', href: '#rate-limits', icon: Shield },
]

const BASE = 'https://your-school.terasms.com'
const AUTH = '-H "Authorization: Bearer tsk_live_xxxx"'

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold mb-4">
          <Terminal className="w-3.5 h-3.5" /> REST API — v1
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">API Documentation</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Complete reference for all Tera SM API endpoints. Every route, parameter, and response — documented and searchable.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            { icon: CheckCircle2, label: 'REST + JSON', color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' },
            { icon: Shield, label: 'Bearer token auth', color: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400' },
            { icon: Zap, label: '75+ endpoints', color: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400' },
          ].map(b => (
            <div key={b.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${b.color}`}>
              <b.icon className="w-3.5 h-3.5" /> {b.label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24 space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
            {nav.map(n => (
              <a key={n.label} href={n.href}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <n.icon className="w-3.5 h-3.5 flex-shrink-0" />{n.label}
              </a>
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
          </Section>

          {/* LMS */}
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
  )
}
