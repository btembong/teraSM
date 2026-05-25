'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Users, UserPlus, Search,
  X, Loader2, UserCheck, UserX, Trash2,
  Link2, Eye, EyeOff, Upload, Download, FileText,
  CheckCircle2, Clock,
  Pencil, KeyRound, GraduationCap, BookOpen,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Status   = 'ACTIVE' | 'PENDING' | 'INACTIVE'
type Standing = 'GOOD_STANDING' | 'PROBATION' | 'SUSPENDED' | 'DISMISSED'
type StandingFilter = 'ALL' | Standing

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  status: Status
  createdAt: string
  lastLoginAt: string | null
  academicStanding?: Standing
  standingNote?: string | null
  studentId?: string | null
  level?: number | null
  admissionYear?: number | null
  cgpa?: number | null
  totalCredits?: number | null
  programName?: string | null
  requiredCredits?: number | null
}

const STATUS_COLORS: Record<Status, string> = {
  ACTIVE:   'bg-green-50 text-green-700',
  PENDING:  'bg-amber-50 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
}

const STANDING_CONFIG: Record<Standing, { label: string; color: string }> = {
  GOOD_STANDING: { label: 'Good Standing', color: 'bg-green-100 text-green-700' },
  PROBATION:     { label: 'Probation',      color: 'bg-amber-100 text-amber-700' },
  SUSPENDED:     { label: 'Suspended',      color: 'bg-red-100 text-red-700'    },
  DISMISSED:     { label: 'Dismissed',      color: 'bg-gray-900 text-white'     },
}

const STANDING_FILTERS: { value: StandingFilter; label: string }[] = [
  { value: 'ALL',           label: 'All Standing'  },
  { value: 'GOOD_STANDING', label: 'Good Standing' },
  { value: 'PROBATION',     label: 'Probation'     },
  { value: 'SUSPENDED',     label: 'Suspended'     },
  { value: 'DISMISSED',     label: 'Dismissed'     },
]

const fieldCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'

function initials(s: Student) {
  return `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700', 'bg-cyan-100 text-cyan-700',
]
function avatarColor(email: string) {
  let h = 0
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xFFFFFF
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ── Standing Modal ─────────────────────────────────────────────────────────────
function StandingModal({ student, onClose, onUpdated }: {
  student: Student; onClose: () => void
  onUpdated: (standing: Standing, note: string) => void
}) {
  const [standing, setStanding] = useState<Standing>(student.academicStanding ?? 'GOOD_STANDING')
  const [note, setNote]         = useState(student.standingNote ?? '')
  const [saving, setSaving]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/admin/students/${student.id}/standing`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standing, note }),
    })
    onUpdated(standing, note); setSaving(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Academic Standing</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Update standing for <span className="font-semibold text-gray-900">{student.firstName} {student.lastName}</span></p>
          <div className="space-y-2">
            {(Object.keys(STANDING_CONFIG) as Standing[]).map(s => (
              <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${standing === s ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="standing" value={s} checked={standing === s} onChange={() => setStanding(s)} className="sr-only" />
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${standing === s ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <span className="text-sm font-medium text-gray-800">{STANDING_CONFIG[s].label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={`${fieldCls} resize-none`} placeholder="e.g. Failed 3 or more courses this semester" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Student Modal ──────────────────────────────────────────────────────────
interface Programme { id: string; name: string; code: string }

function AddStudentModal({ onClose, onSaved }: { onClose: () => void; onSaved: (s: Student) => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', dateOfBirth: '', gender: '',
    programId: '', level: '100', admissionYear: String(new Date().getFullYear()), transferCredits: '',
  })
  const [programmes, setPrograms] = useState<Programme[]>([])
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/academics/programs').then(r => r.json()).then(d => setPrograms(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'STUDENT' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }
    onSaved(data)
  }

  const isTransfer = form.level !== '100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">Add Student</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} className={fieldCls} placeholder="John" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} className={fieldCls} placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={fieldCls} placeholder="john@school.edu" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Temporary password <span className="font-normal text-gray-400">(min 8 chars)</span></label>
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} minLength={8} className={`${fieldCls} pr-10`} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Academic Placement */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Academic Placement</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Programme</label>
              <select value={form.programId} onChange={e => set('programId', e.target.value)} className={fieldCls}>
                <option value="">— Select programme (optional) —</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                <select value={form.level} onChange={e => set('level', e.target.value)} className={fieldCls}>
                  {[100, 200, 300, 400, 500, 600, 700, 800].map(l => (
                    <option key={l} value={String(l)}>Level {l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Admission Year</label>
                <input type="number" min="2000" max="2100" value={form.admissionYear} onChange={e => set('admissionYear', e.target.value)} className={fieldCls} />
              </div>
            </div>
            {isTransfer && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transfer Credits <span className="font-normal text-gray-400">(credited from previous institution)</span></label>
                <input type="number" min="0" max="999" value={form.transferCredits} onChange={e => set('transferCredits', e.target.value)} className={fieldCls} placeholder="e.g. 45" />
              </div>
            )}
          </div>

          {/* Personal Details */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Details <span className="font-normal normal-case text-gray-400">(optional)</span></p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={fieldCls} placeholder="+1 234 567 8900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={fieldCls}>
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
            <p>
              {isTransfer
                ? `Transfer student — placed at Level ${form.level}${form.transferCredits ? ` with ${form.transferCredits} transfer credits` : ''}. A welcome email will be sent.`
                : 'New student — placed at Level 100. A welcome email will be sent.'}
            </p>
          </div>
          {error && <p className="text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Student Modal ─────────────────────────────────────────────────────────
function EditStudentModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: (s: Student) => void }) {
  const [form, setForm] = useState({ firstName: student.firstName, lastName: student.lastName, email: student.email })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res  = await fetch(`/api/admin/users/${student.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }
    onSaved({ ...student, ...form })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Edit Student</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={fieldCls} />
          </div>
          {error && <p className="text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset Password Modal ───────────────────────────────────────────────────────
function ResetPasswordModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res  = await fetch(`/api/admin/users/${student.id}/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }
    setDone(true); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Reset password</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Password updated</p>
              <p className="text-sm text-gray-400">Share the new password with {student.firstName} securely.</p>
              <button onClick={onClose} className="mt-5 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700">Done</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-gray-500">New password for <span className="font-semibold text-gray-900">{student.firstName} {student.lastName}</span></p>
              <div>
                <div className="relative">
                  <input required autoFocus type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={8} className={`${fieldCls} pr-10`} placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Reset'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CSV Import Modal ───────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [rows, setRows]           = useState<any[]>([])
  const [fileName, setFileName]   = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult]       = useState<{ created: number; skipped: number; results: any[] } | null>(null)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_]+/g, ''))
    const map: Record<string, string> = {
      firstname: 'firstName', lastname: 'lastName', surname: 'lastName',
      email: 'email', emailaddress: 'email',
      password: 'password', pass: 'password',
      level: 'level',
      programcode: 'programCode', programmecode: 'programCode', program: 'programCode', programme: 'programCode',
      admissionyear: 'admissionYear', intakeyear: 'admissionYear',
      transfercredits: 'transferCredits', creditstransferred: 'transferCredits',
    }
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: any = { role: 'STUDENT' }
      headers.forEach((h, i) => { obj[map[h] ?? h] = vals[i] ?? '' })
      return obj
    }).filter(r => r.email)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setFileName(file.name); setResult(null); setError('')
    const reader = new FileReader()
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string))
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!rows.length) return
    setImporting(true); setError('')
    const res = await fetch('/api/admin/users/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Import failed'); setImporting(false); return }
    setResult(data); setImporting(false)
    if (data.created > 0) onImported()
  }

  function downloadTemplate() {
    const csv = [
      'firstName,lastName,email,password,level,programCode,admissionYear,transferCredits',
      'John,Doe,john@school.edu,ChangeMe123!,100,BSC-CS,2025,0',
      'Jane,Smith,jane@school.edu,ChangeMe123!,300,BSC-ENG,2023,45',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'students-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Import Students from CSV</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div>
              <p className="text-sm font-semibold text-blue-900">Download template</p>
              <p className="text-xs text-blue-600 mt-0.5">firstName, lastName, email, password, level, programCode, admissionYear, transferCredits</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all" onClick={() => fileRef.current?.click()}>
            {fileName ? (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-5 h-5 text-blue-500" />{fileName}
                <span className="text-gray-400 font-normal">· {rows.length} students</span>
              </div>
            ) : (
              <><Upload className="w-6 h-6 text-gray-300 mb-1" /><p className="text-sm font-medium text-gray-600">Click to upload CSV</p></>
            )}
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {error && <p className="text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl">{error}</p>}
          {result && (
            <div className="flex gap-3">
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{result.created}</p>
                <p className="text-xs text-blue-600 font-medium">Added</p>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-gray-600">{result.skipped}</p>
                <p className="text-xs text-gray-600 font-medium">Skipped</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">{result ? 'Close' : 'Cancel'}</button>
            {!result && (
              <button onClick={handleImport} disabled={!rows.length || importing} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : `Import ${rows.length} students`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Placement Modal ────────────────────────────────────────────────────────────
function PlacementModal({ student, onClose, onSaved }: {
  student: Student
  onClose: () => void
  onSaved: (patch: Partial<Student>) => void
}) {
  const [programmes, setPrograms] = useState<Programme[]>([])
  const [form, setForm] = useState({
    programId:       '',
    level:           String(student.level ?? 100),
    admissionYear:   String(student.admissionYear ?? new Date().getFullYear()),
    expectedGradYear:'',
    transferCredits: '',
    cgpa:            '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/academics/programs').then(r => r.json()).then((d: any[]) => {
      setPrograms(Array.isArray(d) ? d : [])
      // Pre-select current programme
      if (student.programName) {
        const match = d.find((p: any) => p.name === student.programName)
        if (match) set('programId', match.id)
      }
    }).catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const body: any = {
      level:        Number(form.level),
      admissionYear:Number(form.admissionYear),
    }
    if (form.programId)        body.programId        = form.programId
    if (form.expectedGradYear) body.expectedGradYear = Number(form.expectedGradYear)
    if (form.transferCredits)  body.transferCredits  = Number(form.transferCredits)
    if (form.cgpa)             body.cgpa             = parseFloat(form.cgpa)

    const res  = await fetch(`/api/admin/students/${student.id}/profile`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }

    onSaved({
      programName:  data.programName,
      level:        data.level,
      admissionYear:data.admissionYear,
      cgpa:         data.cgpa,
      totalCredits: data.totalCredits,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900">Academic Placement</h2>
            <p className="text-xs text-gray-400 mt-0.5">{student.firstName} {student.lastName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Programme</label>
            <select value={form.programId} onChange={e => set('programId', e.target.value)} className={fieldCls}>
              <option value="">— No programme assigned —</option>
              {programmes.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)} className={fieldCls}>
                {[100, 200, 300, 400, 500, 600, 700, 800].map(l => (
                  <option key={l} value={String(l)}>Level {l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Admission Year</label>
              <input type="number" min="2000" max="2100" value={form.admissionYear} onChange={e => set('admissionYear', e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expected Grad Year <span className="font-normal text-gray-400">(opt)</span></label>
              <input type="number" min="2000" max="2100" value={form.expectedGradYear} onChange={e => set('expectedGradYear', e.target.value)} className={fieldCls} placeholder={String(Number(form.admissionYear) + 4)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transfer Credits <span className="font-normal text-gray-400">(opt)</span></label>
              <input type="number" min="0" max="999" value={form.transferCredits} onChange={e => set('transferCredits', e.target.value)} className={fieldCls} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CGPA Override <span className="font-normal text-gray-400">(leave blank to keep calculated)</span></label>
            <input type="number" step="0.01" min="0" max="4" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} className={fieldCls} placeholder={student.cgpa ? String(student.cgpa) : 'e.g. 3.45'} />
          </div>
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
            <p>Transfer credits set a baseline — earned credits from courses at this institution are added on top. CGPA override replaces the system-calculated value.</p>
          </div>
          {error && <p className="text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Placement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AllStudentsPage() {
  const [students, setStudents]   = useState<Student[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [standing, setStanding]   = useState<StandingFilter>('ALL')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)

  const [showAdd,           setShowAdd]           = useState(false)
  const [editStudent,       setEditStudent]       = useState<Student | null>(null)
  const [resetStudent,      setResetStudent]      = useState<Student | null>(null)
  const [showImport,        setShowImport]        = useState(false)
  const [standingStudent,   setStandingStudent]   = useState<Student | null>(null)
  const [placementStudent,  setPlacementStudent]  = useState<Student | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStudents = useCallback(async (s: string, p: number, st: StandingFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ role: 'STUDENT', search: s, page: String(p) })
    if (st !== 'ALL') params.set('standing', st)
    const res  = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setStudents(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStudents(search, page, standing) }, [page, standing])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); fetchStudents(val, 1, standing) }, 300)
  }

  const updateStudent = (id: string, patch: Partial<Student>) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const onAdded  = (s: Student) => { setShowAdd(false); setStudents(prev => [s, ...prev]); setTotal(t => t + 1) }
  const onEdited = (s: Student) => { setEditStudent(null); updateStudent(s.id, s) }

  async function handleSetStatus(student: Student, status: Status) {
    await fetch(`/api/admin/users/${student.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    updateStudent(student.id, { status })
  }

  async function handleDelete(student: Student) {
    if (!confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)) return
    await fetch(`/api/admin/users/${student.id}`, { method: 'DELETE' })
    setStudents(prev => prev.filter(s => s.id !== student.id))
    setTotal(t => t - 1)
  }

  function exportCSV() {
    const params = new URLSearchParams({ role: 'STUDENT', search })
    if (standing !== 'ALL') params.set('standing', standing)
    window.location.href = `/api/admin/users/export?${params}`
  }

  return (
    <div className="space-y-5">
      {showAdd         && <AddStudentModal onClose={() => setShowAdd(false)} onSaved={onAdded} />}
      {editStudent     && <EditStudentModal student={editStudent} onClose={() => setEditStudent(null)} onSaved={onEdited} />}
      {resetStudent    && <ResetPasswordModal student={resetStudent} onClose={() => setResetStudent(null)} />}
      {showImport      && <ImportModal onClose={() => setShowImport(false)} onImported={() => fetchStudents(search, page, standing)} />}
      {standingStudent && (
        <StandingModal
          student={standingStudent}
          onClose={() => setStandingStudent(null)}
          onUpdated={(s, n) => { updateStudent(standingStudent.id, { academicStanding: s, standingNote: n }); setStandingStudent(null) }}
        />
      )}
      {placementStudent && (
        <PlacementModal
          student={placementStudent}
          onClose={() => setPlacementStudent(null)}
          onSaved={patch => { updateStudent(placementStudent.id, patch); setPlacementStudent(null) }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Students</h2>
          <p className="text-sm text-gray-400">{total.toLocaleString()} {total === 1 ? 'student' : 'students'} in total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <Link href="/admin/invites" className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
            <Link2 className="w-4 h-4" /> Send invite
          </Link>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, email or student ID…"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={standing} onChange={e => { setStanding(e.target.value as StandingFilter); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STANDING_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{search ? `No students matching "${search}"` : 'No students yet.'}</p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Add Student
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Programme / Level</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">CGPA</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Credits</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Standing</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Last Login</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map(s => {
                const ac        = avatarColor(s.email)
                const cgpa      = s.cgpa ?? 0
                const cgpaColor = cgpa >= 3.5 ? 'text-emerald-600' : cgpa >= 3.0 ? 'text-blue-600' : cgpa >= 2.0 ? 'text-amber-600' : 'text-red-500'
                const cgpaBg    = cgpa >= 3.5 ? 'bg-emerald-50 border-emerald-200' : cgpa >= 3.0 ? 'bg-blue-50 border-blue-200' : cgpa >= 2.0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                const earned    = s.totalCredits ?? 0
                const required  = s.requiredCredits ?? 120
                const creditPct = Math.min(Math.round((earned / required) * 100), 100)
                const lastLogin = s.lastLoginAt
                  ? new Date(s.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : null

                return (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Student */}
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${ac}`}>
                          {initials(s)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{s.email}</p>
                          {s.studentId && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{s.studentId}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Programme / Level */}
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      {s.programName
                        ? <><p className="text-sm text-gray-700 font-medium truncate max-w-[180px]">{s.programName}</p>
                            <span className="inline-flex mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-100">Level {s.level ?? '—'}</span></>
                        : s.level
                          ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-100">Level {s.level}</span>
                          : <span className="text-xs text-gray-300 italic">No profile</span>}
                      {s.admissionYear && <p className="text-[10px] text-gray-400 mt-0.5">{s.admissionYear} intake</p>}
                    </td>

                    {/* CGPA */}
                    <td className="px-5 py-3.5 border-r border-gray-100 text-center">
                      {s.studentId
                        ? <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${cgpaBg} ${cgpaColor}`}>{cgpa.toFixed(2)}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Credits */}
                    <td className="px-5 py-3.5 border-r border-gray-100 text-center">
                      {s.studentId
                        ? <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-gray-700">{earned}<span className="font-normal text-gray-400">/{required}</span></span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${creditPct >= 100 ? 'bg-emerald-500' : creditPct >= 60 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${creditPct}%` }} />
                            </div>
                          </div>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Standing */}
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      {s.academicStanding && s.academicStanding !== 'GOOD_STANDING'
                        ? <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STANDING_CONFIG[s.academicStanding].color}`}>{STANDING_CONFIG[s.academicStanding].label}</span>
                        : <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Good</span>}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>
                        {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      {lastLogin
                        ? <div className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3 text-gray-300" />{lastLogin}</div>
                        : <span className="text-xs text-gray-300 italic">Never</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditStudent(s)} title="Edit" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setResetStudent(s)} title="Reset password" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><KeyRound className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setStandingStudent(s)} title="Academic Standing" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><GraduationCap className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setPlacementStudent(s)} title="Edit Placement (Level / Programme)" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><BookOpen className="w-3.5 h-3.5" /></button>
                        {s.status === 'ACTIVE'
                          ? <button onClick={() => handleSetStatus(s, 'INACTIVE')} title="Deactivate" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                          : <button onClick={() => handleSetStatus(s, 'ACTIVE')} title="Activate" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><UserCheck className="w-3.5 h-3.5" /></button>}
                        <Link href={`/admin/students/${s.id}/documents`} title="Documents" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FileText className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => handleDelete(s)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {total > 20 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-400">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} students</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
                <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
