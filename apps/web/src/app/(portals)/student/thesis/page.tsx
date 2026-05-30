'use client'

import { useEffect, useState, useRef } from 'react'
import {
  BookOpen, Plus, Upload, Send, ChevronDown, ChevronUp,
  FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, X, Loader2, Download, Eye
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTable } from '@/components/ui/skeleton'

interface ThesisVersion {
  id: string; version: number; fileUrl: string; fileName: string
  fileSize?: number; uploadedAt: string; note?: string
}
interface ThesisFeedback {
  id: string; content: string; createdAt: string; isPrivate: boolean
  author: { id: string; firstName: string; lastName: string }
}
interface Thesis {
  id: string; title: string; abstract?: string; department?: string
  program?: string; academicYear?: string; status: string
  submittedAt?: string; approvedAt?: string; publishedAt?: string; tags: string[]
  supervisor?: { id: string; firstName: string; lastName: string } | null
  versions: ThesisVersion[]; feedbacks: ThesisFeedback[]
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:              'bg-gray-100 text-gray-600',
  SUBMITTED:          'bg-blue-100 text-blue-700',
  UNDER_REVIEW:       'bg-yellow-100 text-yellow-700',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED:           'bg-green-100 text-green-700',
  REJECTED:           'bg-red-100 text-red-700',
  PUBLISHED:          'bg-indigo-100 text-indigo-700',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  DRAFT: FileText, SUBMITTED: Clock, UNDER_REVIEW: Eye,
  REVISION_REQUESTED: AlertCircle, APPROVED: CheckCircle2,
  REJECTED: XCircle, PUBLISHED: BookOpen,
}

const EMPTY_FORM = { title: '', abstract: '', department: '', program: '', academicYear: '', tags: '' }

export default function StudentThesisPage() {
  const [theses, setTheses]       = useState<Thesis[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadNote, setUploadNote] = useState('')
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [msg, setMsg]             = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/student/thesis')
    const data = await res.json()
    setTheses(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createThesis() {
    if (!form.title.trim()) { setMsg({ type: 'err', text: 'Title is required.' }); return }
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/student/thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.message ?? 'Failed.' }); return }
      setTheses(prev => [data, ...prev])
      setShowNew(false); setForm(EMPTY_FORM)
    } catch { setMsg({ type: 'err', text: 'Network error.' }) }
    finally { setSaving(false) }
  }

  async function submitThesis(id: string) {
    setSubmitting(id)
    try {
      const res = await fetch(`/api/student/thesis/${id}/submit`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Submit failed.'); return }
      setTheses(prev => prev.map(t => t.id === id ? data : t))
    } catch { alert('Network error.') }
    finally { setSubmitting(null) }
  }

  function triggerUpload(thesisId: string) {
    setUploadTarget(thesisId)
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return
    setUploading(uploadTarget)

    // In production, upload to R2 and get URL back. Here we simulate with a placeholder.
    // TODO: wire to /api/chat/upload or a dedicated R2 upload endpoint
    const fileName = file.name
    const fileSize = file.size
    const fileUrl  = `https://files.placeholder.com/${fileName}` // placeholder

    try {
      const res = await fetch(`/api/student/thesis/${uploadTarget}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, fileName, fileSize, note: uploadNote }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Upload failed.'); return }
      // Refresh
      await load()
      setUploadNote('')
    } catch { alert('Network error.') }
    finally { setUploading(null); setUploadTarget(null); if (fileRef.current) fileRef.current.value = '' }
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Thesis</h1>
          <p className="text-gray-500 text-sm">Submit and track your thesis or dissertation</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setMsg(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Thesis
        </button>
      </div>

      {/* New thesis form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">New Thesis / Dissertation</h2>
            <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={lbl}>Title *</label>
              <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Full title of your thesis" />
            </div>
            <div>
              <label className={lbl}>Department</label>
              <input className={inp} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label className={lbl}>Program</label>
              <input className={inp} value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} placeholder="e.g. MSc Software Engineering" />
            </div>
            <div>
              <label className={lbl}>Academic Year</label>
              <input className={inp} value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2024/2025" />
            </div>
            <div>
              <label className={lbl}>Tags (comma-separated)</label>
              <input className={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, Machine Learning, NLP" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Abstract</label>
              <textarea className={`${inp} resize-none`} rows={4} value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} placeholder="Brief summary of your thesis (optional at this stage)" />
            </div>
          </div>
          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
              {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button onClick={createThesis} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Draft
            </button>
          </div>
        </div>
      )}

      {/* Thesis list */}
      {loading ? (
        <SkeletonTable rows={3} />
      ) : theses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No thesis submitted yet"
          description="Start your thesis journey by creating a new draft above."
        />
      ) : (
        <div className="space-y-4">
          {theses.map(t => {
            const StatusIcon = STATUS_ICONS[t.status] ?? FileText
            const isOpen = expanded === t.id
            const latestVersion = t.versions[0]
            const canSubmit = ['DRAFT', 'REVISION_REQUESTED'].includes(t.status)
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <StatusIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{t.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[t.status]}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {t.program && <span>{t.program}</span>}
                      {t.academicYear && <span>· {t.academicYear}</span>}
                      {t.supervisor && <span>· Supervisor: {t.supervisor.firstName} {t.supervisor.lastName}</span>}
                      {t.versions.length > 0 && <span>· v{t.versions.length} uploaded</span>}
                    </div>
                    {t.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {t.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-5 space-y-5">
                    {/* Abstract */}
                    {t.abstract && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Abstract</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{t.abstract}</p>
                      </div>
                    )}

                    {/* Versions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Uploaded Versions</p>
                      {t.versions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No document uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {[...t.versions].sort((a, b) => b.version - a.version).map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                <p className="text-sm font-medium text-gray-800">Version {v.version} — {v.fileName}</p>
                                {v.note && <p className="text-xs text-gray-400 mt-0.5">{v.note}</p>}
                                <p className="text-xs text-gray-300">{new Date(v.uploadedAt).toLocaleDateString()}</p>
                              </div>
                              <a href={v.fileUrl} target="_blank" rel="noreferrer"
                                className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upload new version */}
                    {['DRAFT', 'REVISION_REQUESTED', 'SUBMITTED'].includes(t.status) && (
                      <div className="flex items-center gap-3">
                        <input
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Upload note (optional)"
                          value={uploadTarget === t.id ? uploadNote : ''}
                          onChange={e => { setUploadTarget(t.id); setUploadNote(e.target.value) }}
                        />
                        <button
                          onClick={() => triggerUpload(t.id)}
                          disabled={uploading === t.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          {uploading === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          Upload PDF
                        </button>
                      </div>
                    )}

                    {/* Feedbacks */}
                    {t.feedbacks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Supervisor Feedback
                        </p>
                        <div className="space-y-2">
                          {t.feedbacks.map(fb => (
                            <div key={fb.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                              <p className="text-sm text-gray-700">{fb.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                — {fb.author.firstName} {fb.author.lastName} · {new Date(fb.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit button */}
                    {canSubmit && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => submitThesis(t.id)}
                          disabled={submitting === t.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          {submitting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Submit for Review
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
