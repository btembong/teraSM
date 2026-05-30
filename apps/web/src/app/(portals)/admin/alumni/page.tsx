'use client'

import { useEffect, useRef, useState } from 'react'
import {
  GraduationCap, Search, Briefcase, Upload,
  CheckCircle2, XCircle, Loader2, Download, AlertCircle, Link2, Copy, Check,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTable } from '@/components/ui/skeleton'

interface AlumniProfile {
  id: string; userId: string; graduationYear: number
  degree?: string; major?: string; currentEmployer?: string
  currentRole?: string; linkedIn?: string; bio?: string; isPublic: boolean
  user: { id: string; firstName: string; lastName: string; email: string; profilePicUrl?: string }
}

interface ImportResult {
  row: number; email: string; status: 'created' | 'skipped'; reason?: string
}

const CSV_TEMPLATE = `firstName,lastName,email,graduationYear,degree,major,currentEmployer,currentRole,linkedIn,bio
Jane,Doe,jane.doe@example.com,2019,BSc,Computer Science,Google,Software Engineer,https://linkedin.com/in/janedoe,Passionate about technology
John,Smith,john.smith@example.com,2021,MBA,Finance,Accenture,Consultant,,`

export default function AdminAlumniPage() {
  const [alumni, setAlumni]       = useState<AlumniProfile[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<'directory' | 'import' | 'link'>('directory')

  // Import state
  const [csvText, setCsvText]     = useState('')
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ created: number; skipped: number; results: ImportResult[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Link copy state
  const [copied, setCopied]       = useState(false)
  const [tenantSlug, setTenantSlug] = useState('')

  async function load() {
    setLoading(true)
    const res  = await fetch(`/api/admin/alumni?search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setAlumni(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Derive tenant slug from current hostname
  useEffect(() => {
    const host = window.location.hostname
    const slug = host.split('.')[0]
    setTenantSlug(slug === 'localhost' ? 'your-school-slug' : slug)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText(ev.target?.result as string ?? '')
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function runImport() {
    if (!csvText.trim()) return
    setImporting(true); setImportResults(null)
    try {
      const res = await fetch('/api/admin/alumni/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Import failed.'); return }
      setImportResults(data)
      if (data.created > 0) await load() // refresh directory
    } catch { alert('Network error.') }
    finally { setImporting(false) }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'alumni-import-template.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  function copyLink() {
    const url = `${window.location.origin}/alumni/register?school=${tenantSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const filtered = alumni.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${a.user.firstName} ${a.user.lastName}`.toLowerCase().includes(q) ||
      a.user.email.toLowerCase().includes(q) ||
      a.major?.toLowerCase().includes(q) ||
      a.currentEmployer?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumni Network</h1>
          <p className="text-gray-500 text-sm">{alumni.length} registered alumni</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'directory', label: 'Directory' },
          { key: 'import',    label: 'CSV Import' },
          { key: 'link',      label: 'Share Link' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Directory tab ── */}
      {tab === 'directory' && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white max-w-md">
            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <input
              className="flex-1 text-sm outline-none"
              placeholder="Search by name, email, major…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <SkeletonTable rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No alumni profiles yet"
              description="Use CSV Import to add historical graduates, or share the registration link."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm table-hover">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alumni</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Degree / Major</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Role</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibility</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(a => {
                    const initials = `${a.user.firstName[0]}${a.user.lastName[0]}`.toUpperCase()
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {a.user.profilePicUrl ? (
                              <img src={a.user.profilePicUrl} alt={initials} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{initials}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{a.user.firstName} {a.user.lastName}</p>
                              <p className="text-xs text-gray-400">{a.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 font-medium">{a.graduationYear}</td>
                        <td className="px-5 py-3.5">
                          <p className="text-gray-900">{a.degree ?? '—'}</p>
                          {a.major && <p className="text-xs text-gray-400">{a.major}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          {a.currentRole || a.currentEmployer ? (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm truncate max-w-[180px]">{[a.currentRole, a.currentEmployer].filter(Boolean).join(' at ')}</span>
                            </div>
                          ) : <span className="text-gray-300 text-xs italic">Not set</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${a.isPublic ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.isPublic ? 'Public' : 'Private'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {a.linkedIn && (
                            <a href={a.linkedIn} target="_blank" rel="noreferrer"
                              className="p-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center">
                              in
                            </a>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── CSV Import tab ── */}
      {tab === 'import' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <h3 className="font-semibold text-blue-900 mb-1">Bulk Import Historical Alumni</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Upload a CSV file of your existing graduates. Each alumnus will receive an email with a temporary password to claim their account. You can use the template below.
            </p>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">CSV Template</p>
              <p className="text-xs text-gray-400">Required: firstName, lastName, email, graduationYear</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" /> Download Template
            </button>
          </div>

          {/* File upload */}
          <div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 text-sm font-medium rounded-xl transition-colors w-full justify-center"
            >
              <Upload className="w-4 h-4" /> Click to upload CSV file
            </button>
          </div>

          {/* Or paste CSV */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Or paste CSV content directly</label>
            <textarea
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-40"
              placeholder={CSV_TEMPLATE}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
          </div>

          <button
            onClick={runImport}
            disabled={importing || !csvText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Importing…' : 'Run Import'}
          </button>

          {/* Results */}
          {importResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">{importResults.created}</p>
                    <p className="text-xs text-green-600">Accounts created</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{importResults.skipped}</p>
                    <p className="text-xs text-orange-500">Rows skipped</p>
                  </div>
                </div>
              </div>

              {/* Row-by-row results */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Row</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Email</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {importResults.results.map(r => (
                      <tr key={r.row} className={r.status === 'skipped' ? 'bg-red-50/30' : ''}>
                        <td className="px-4 py-2.5 text-gray-400">{r.row}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.email}</td>
                        <td className="px-4 py-2.5">
                          {r.status === 'created' ? (
                            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Created</span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> Skipped</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">{r.reason ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importResults.created > 0 && (
                <p className="text-xs text-gray-500">
                  {importResults.created} alumni received a "Claim your account" email with their temporary password.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Share Link tab ── */}
      {tab === 'link' && (
        <div className="max-w-xl space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Self-Registration Link</h3>
                <p className="text-sm text-gray-500">Share this link with alumni so they can register themselves</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <code className="flex-1 text-sm text-gray-700 break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/alumni/register?school=${tenantSlug}` : `/alumni/register?school=${tenantSlug}`}
              </code>
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                  copied ? 'bg-green-50 text-green-600' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <p className="font-medium text-gray-700">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Share this link via email newsletter, WhatsApp, or your school website</li>
                <li>Alumni fill in their details and create a password</li>
                <li>They appear in the directory immediately and receive a welcome email</li>
                <li>Current students can browse their profiles and request mentorship</li>
              </ol>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <strong>Tip:</strong> The <code className="bg-amber-100 px-1 rounded text-xs">?school=</code> parameter must match your school's subdomain slug exactly. It is already pre-filled correctly above.
          </div>
        </div>
      )}
    </div>
  )
}
