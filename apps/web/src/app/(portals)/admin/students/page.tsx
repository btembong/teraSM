'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Users, UserPlus, Search, ChevronDown, MoreVertical,
  X, Loader2, UserCheck, UserX, Trash2,
  Link2, Eye, EyeOff, Upload, Download, FileText,
  CheckCircle2, AlertCircle, Calendar, Clock,
  Pencil, KeyRound,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
type Role = 'ALL' | 'STUDENT' | 'TEACHER' | 'STAFF' | 'PARENT' | 'REGISTRAR' | 'FINANCE_ADMIN' | 'HR_ADMIN' | 'TENANT_ADMIN'
type Status = 'ACTIVE' | 'PENDING' | 'INACTIVE'

interface User {
  id: string; firstName: string; lastName: string
  email: string; role: string; status: Status
  createdAt: string; lastLoginAt: string | null
}

// ── Constants ────────────────────────────────────────────────────────────────
const ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'ALL',          label: 'All users',    color: 'bg-gray-100 text-gray-700' },
  { value: 'STUDENT',      label: 'Student',      color: 'bg-blue-100 text-blue-700' },
  { value: 'TEACHER',      label: 'Teacher',      color: 'bg-blue-100 text-blue-700' },
  { value: 'STAFF',        label: 'Staff',        color: 'bg-blue-50 text-blue-600' },
  { value: 'PARENT',       label: 'Parent',       color: 'bg-gray-100 text-gray-700' },
  { value: 'REGISTRAR',    label: 'Registrar',    color: 'bg-blue-50 text-blue-700' },
  { value: 'FINANCE_ADMIN',label: 'Finance Admin',color: 'bg-blue-100 text-blue-800' },
  { value: 'HR_ADMIN',     label: 'HR Admin',     color: 'bg-blue-50 text-blue-600' },
  { value: 'TENANT_ADMIN', label: 'School Admin', color: 'bg-blue-600 text-white' },
]

const STATUS_COLORS: Record<Status, string> = {
  ACTIVE:   'bg-blue-50 text-blue-700',
  PENDING:  'bg-blue-100 text-blue-600',
  INACTIVE: 'bg-gray-100 text-gray-500',
}

function roleInfo(role: string) {
  return ROLES.find(r => r.value === role) ?? { label: role, color: 'bg-gray-100 text-gray-700' }
}

function initials(u: User) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-blue-200 text-blue-800',
  'bg-blue-50 text-blue-600', 'bg-gray-100 text-gray-700',
  'bg-blue-100 text-blue-800', 'bg-gray-200 text-gray-700',
]
function avatarColor(email: string) {
  let h = 0
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xFFFFFF
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const fieldCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function UserFormModal({
  user, onClose, onSaved,
}: {
  user: User | null
  onClose: () => void
  onSaved: (u: User) => void
}) {
  const isEdit = !!user
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.email     ?? '',
    role:      user?.role      ?? 'STUDENT',
    password:  '',
  })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError('')
    const url    = isEdit ? `/api/admin/users/${user!.id}` : '/api/admin/users'
    const method = isEdit ? 'PATCH' : 'POST'
    const body   = isEdit
      ? { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role }
      : form
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }
    onSaved(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit user' : 'Create user'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">First name</label>
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} className={fieldCls} placeholder="John" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last name</label>
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} className={fieldCls} placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={fieldCls} placeholder="john@school.edu" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
            <div className="relative">
              <select value={form.role} onChange={e => set('role', e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                {ROLES.filter(r => r.value !== 'ALL').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password <span className="font-normal text-gray-400">(min 8 chars)</span></label>
              <div className="relative">
                <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} minLength={8} className={`${fieldCls} pr-10`} placeholder="Temporary password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-gray-900 font-medium bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : isEdit ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError('')
    const res  = await fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }
    setDone(true)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Reset password</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Password updated</p>
              <p className="text-sm text-gray-400">Share the new password with {user.firstName} securely.</p>
              <button onClick={onClose} className="mt-5 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">Done</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-gray-500">Set a new password for <span className="font-semibold text-gray-900">{user.firstName} {user.lastName}</span>.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New password <span className="font-normal text-gray-400">(min 8 chars)</span></label>
                <div className="relative">
                  <input required autoFocus type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={8} className={`${fieldCls} pr-10`} placeholder="Enter new password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-gray-900 font-medium bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Reset password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [rows, setRows]       = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult]   = useState<{ created: number; skipped: number; results: any[] } | null>(null)
  const [error, setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''))
    // Map common header variants
    const map: Record<string, string> = {
      firstname: 'firstName', first_name: 'firstName', first: 'firstName',
      lastname: 'lastName', last_name: 'lastName', last: 'lastName', surname: 'lastName',
      email: 'email', emailaddress: 'email',
      role: 'role',
      password: 'password', pass: 'password',
    }
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: any = {}
      headers.forEach((h, i) => { obj[map[h] ?? h] = vals[i] ?? '' })
      return obj
    }).filter(r => r.email)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!rows.length) return
    setImporting(true); setError('')
    const res = await fetch('/api/admin/users/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Import failed'); setImporting(false); return }
    setResult(data)
    setImporting(false)
    if (data.created > 0) onImported()
  }

  function downloadTemplate() {
    const csv = 'firstName,lastName,email,role,password\nJohn,Doe,john@school.edu,STUDENT,ChangeMe123!\nJane,Smith,jane@school.edu,TEACHER,ChangeMe123!'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Import users from CSV</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Template download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div>
              <p className="text-sm font-semibold text-blue-900">Download template</p>
              <p className="text-xs text-blue-600 mt-0.5">firstName, lastName, email, role, password</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          {/* File drop */}
          <label
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            {fileName ? (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="w-5 h-5 text-blue-500" />
                {fileName}
                <span className="text-gray-400 font-normal">· {rows.length} rows</span>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">Click to upload CSV file</p>
                <p className="text-xs text-gray-400 mt-0.5">Max 500 rows</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>

          {/* Valid roles reference */}
          <div className="text-xs text-gray-400">
            <span className="font-semibold text-gray-500">Valid roles: </span>
            STUDENT, TEACHER, STAFF, PARENT, REGISTRAR, FINANCE_ADMIN, HR_ADMIN, TENANT_ADMIN
          </div>

          {error && <p className="text-sm text-gray-900 font-medium bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">{error}</p>}

          {/* Import result */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-blue-600">{result.created}</p>
                  <p className="text-xs text-blue-600 font-medium">Created</p>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-gray-600">{result.skipped}</p>
                  <p className="text-xs text-gray-600 font-medium">Skipped</p>
                </div>
              </div>
              {result.skipped > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {result.results.filter(r => r.status === 'skipped').map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      Row {r.row}: {r.email} — {r.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button onClick={handleImport} disabled={!rows.length || importing} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : `Import ${rows.length} users`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── User Detail Panel ─────────────────────────────────────────────────────────
function DetailPanel({
  user, onClose, onEdit, onResetPw, onUpdate, onDelete,
}: {
  user: User
  onClose: () => void
  onEdit: (u: User) => void
  onResetPw: (u: User) => void
  onUpdate: (id: string, patch: Partial<User>) => void
  onDelete: (id: string) => void
}) {
  const ri = roleInfo(user.role)
  const ac = avatarColor(user.email)
  const [actioning, setActioning] = useState(false)

  async function setStatus(status: Status) {
    setActioning(true)
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate(user.id, { status })
    setActioning(false)
  }

  async function deleteUser() {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) return
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    onDelete(user.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">User details</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Profile */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 ${ac}`}>
              {initials(user)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ri.color}`}>{ri.label}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[user.status]}`}>
              {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="px-6 py-5 space-y-4 border-b border-gray-100">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Joined</p>
              <p className="text-gray-700 font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Last login</p>
              <p className="text-gray-700 font-medium">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Never logged in'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 space-y-2.5 mt-auto">
          <button
            onClick={() => onEdit(user)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-400" /> Edit profile
          </button>
          <button
            onClick={() => onResetPw(user)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-gray-400" /> Reset password
          </button>
          {user.status === 'ACTIVE' ? (
            <button
              onClick={() => setStatus('INACTIVE')}
              disabled={actioning}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <UserX className="w-4 h-4" /> Deactivate account
            </button>
          ) : (
            <button
              onClick={() => setStatus('ACTIVE')}
              disabled={actioning}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-blue-200 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" /> Activate account
            </button>
          )}
          <button
            onClick={deleteUser}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete user
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Row action menu (table quick actions) ────────────────────────────────────
function ActionMenu({ user, onEdit, onResetPw, onUpdate, onDelete }: {
  user: User
  onEdit: (u: User) => void
  onResetPw: (u: User) => void
  onUpdate: (id: string, p: Partial<User>) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function setStatus(status: Status) {
    setOpen(false)
    await fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    onUpdate(user.id, { status })
  }

  async function del() {
    setOpen(false)
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) return
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    onDelete(user.id)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open) }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-xl shadow-lg w-48 overflow-hidden">
          <button onClick={() => { setOpen(false); onEdit(user) }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Pencil className="w-4 h-4 text-gray-400" /> Edit</button>
          <button onClick={() => { setOpen(false); onResetPw(user) }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><KeyRound className="w-4 h-4 text-gray-400" /> Reset password</button>
          <div className="border-t border-gray-100" />
          {user.status !== 'ACTIVE'
            ? <button onClick={() => setStatus('ACTIVE')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"><UserCheck className="w-4 h-4" /> Activate</button>
            : <button onClick={() => setStatus('INACTIVE')} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><UserX className="w-4 h-4" /> Deactivate</button>
          }
          <div className="border-t border-gray-100" />
          <button onClick={del} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete</button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]   = useState<User[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [role, setRole]     = useState<Role>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  // Modals
  const [showCreate,  setShowCreate]  = useState(false)
  const [editUser,    setEditUser]    = useState<User | null>(null)
  const [resetUser,   setResetUser]   = useState<User | null>(null)
  const [showImport,  setShowImport]  = useState(false)
  const [detailUser,  setDetailUser]  = useState<User | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = useCallback(async (r: Role, s: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ role: r, search: s, page: String(p) })
    const res  = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers(role, search, page) }, [role, page])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); fetchUsers(role, val, 1) }, 300)
  }

  const handleRoleFilter = (r: Role) => { setRole(r); setPage(1) }

  const updateUser = (id: string, patch: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
    if (detailUser?.id === id) setDetailUser(prev => prev ? { ...prev, ...patch } : prev)
  }
  const deleteUser = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); setTotal(t => t - 1) }
  const onSaved = (u: User) => {
    setShowCreate(false); setEditUser(null)
    setUsers(prev => {
      const exists = prev.find(x => x.id === u.id)
      if (exists) return prev.map(x => x.id === u.id ? u : x)
      return [u, ...prev]
    })
    if (!users.find(x => x.id === u.id)) setTotal(t => t + 1)
  }

  function exportCSV() {
    const params = new URLSearchParams({ role, search })
    window.location.href = `/api/admin/users/export?${params}`
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Modals */}
      {(showCreate || editUser) && (
        <UserFormModal user={editUser} onClose={() => { setShowCreate(false); setEditUser(null) }} onSaved={onSaved} />
      )}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => fetchUsers(role, search, page)} />}
      {detailUser && (
        <DetailPanel
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onEdit={u => { setDetailUser(null); setEditUser(u) }}
          onResetPw={u => { setDetailUser(null); setResetUser(u) }}
          onUpdate={updateUser}
          onDelete={deleteUser}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} {total === 1 ? 'person' : 'people'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <Link href="/admin/invites" className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
            <Link2 className="w-4 h-4" /> Send invite
          </Link>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <UserPlus className="w-4 h-4" /> Add user
          </button>
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => handleRoleFilter(r.value)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${role === r.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
          <span>Name</span><span>Role</span><span>Status</span><span>Joined</span><span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{search ? `No users matching "${search}"` : 'No users yet.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => {
              const ri = roleInfo(u.role)
              const ac = avatarColor(u.email)
              return (
                <div
                  key={u.id}
                  onClick={() => setDetailUser(u)}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${ac}`}>
                      {initials(u)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${ri.color}`}>{ri.label}</span>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_COLORS[u.status]}`}>
                    {u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <ActionMenu user={u} onEdit={u => { setDetailUser(null); setEditUser(u) }} onResetPw={u => { setDetailUser(null); setResetUser(u) }} onUpdate={updateUser} onDelete={deleteUser} />
                </div>
              )
            })}
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
