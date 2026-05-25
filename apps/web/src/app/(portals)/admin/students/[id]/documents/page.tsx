'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, FileText, Image, File, Trash2,
  Loader2, Plus, X, ExternalLink, FolderOpen,
} from 'lucide-react'

interface Doc {
  id: string; name: string; fileUrl: string; fileType: string
  category: string; createdAt: string
  uploadedByUser: { firstName: string; lastName: string } | null
}

interface Student { id: string; firstName: string; lastName: string; email: string }

const CATEGORIES = ['ID', 'transcript', 'medical', 'financial', 'application', 'other']
const CAT_COLORS: Record<string, string> = {
  ID:          'bg-blue-50 text-blue-700',
  transcript:  'bg-indigo-50 text-indigo-700',
  medical:     'bg-red-50 text-red-700',
  financial:   'bg-green-50 text-green-700',
  application: 'bg-amber-50 text-amber-700',
  other:       'bg-gray-100 text-gray-600',
}

function FileIcon({ type, cls = 'w-8 h-8' }: { type: string; cls?: string }) {
  if (type === 'pdf')   return <FileText className={`${cls} text-red-500`} />
  if (type === 'image') return <Image className={`${cls} text-blue-500`} />
  return <File className={`${cls} text-gray-400`} />
}

const fieldCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'

export default function StudentDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params)
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [docs, setDocs]       = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  // Upload form state
  const [docName, setDocName]       = useState('')
  const [category, setCategory]     = useState('other')
  const [file, setFile]             = useState<File | null>(null)
  const [urlInput, setUrlInput]     = useState('')
  const [uploading, setUploading]   = useState(false)
  const [uploadErr, setUploadErr]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [studentRes, docsRes] = await Promise.all([
      fetch(`/api/admin/users/${studentId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/admin/students/${studentId}/documents`).then(r => r.ok ? r.json() : []),
    ])
    setStudent(studentRes)
    setDocs(docsRes)
    setLoading(false)
  }

  useEffect(() => { load() }, [studentId])

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!docName.trim()) { setUploadErr('Document name is required'); return }
    if (!file && !urlInput.trim()) { setUploadErr('Upload a file or paste a URL'); return }
    setUploading(true); setUploadErr('')

    const fd = new FormData()
    fd.append('name', docName.trim())
    fd.append('category', category)
    if (file) fd.append('file', file)
    if (urlInput.trim()) fd.append('url', urlInput.trim())

    const res = await fetch(`/api/admin/students/${studentId}/documents`, { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setUploadErr(data.error ?? 'Upload failed'); setUploading(false); return }
    setDocs(prev => [data, ...prev])
    setDocName(''); setCategory('other'); setFile(null); setUrlInput(''); setShowForm(false)
    setUploading(false)
  }

  async function deleteDoc(docId: string) {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/admin/students/${studentId}/documents/${docId}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  const filtered = catFilter === 'all' ? docs : docs.filter(d => d.category === catFilter)
  const categories = ['all', ...CATEGORIES.filter(c => docs.some(d => d.category === c))]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/students')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {student ? `${student.firstName} ${student.lastName}` : 'Student'} — Documents
          </h1>
          {student && <p className="text-sm text-gray-500 mt-0.5">{student.email}</p>}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {/* Upload Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Add Document</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={upload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Document Name</label>
                <input
                  className={fieldCls}
                  placeholder="e.g. National ID Card"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <div className="relative">
                  <select
                    className={`${fieldCls} appearance-none pr-8 capitalize`}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Upload File</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold truncate max-w-[200px]">{file.name}</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="text-blue-400 hover:text-blue-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-sm text-gray-500">Click to upload PDF, image, or document</p>
                      <p className="text-xs text-gray-400 mt-0.5">Max 10 MB</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    className="hidden"
                    onChange={e => { setFile(e.target.files?.[0] ?? null); setUrlInput('') }}
                  />
                </div>
              </div>

              {!file && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Or paste a URL <span className="font-normal text-gray-400">(e.g. Google Drive link)</span>
                  </label>
                  <input
                    className={fieldCls}
                    type="url"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                  />
                </div>
              )}

              {uploadErr && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{uploadErr}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category filter */}
      {docs.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${catFilter === c ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
              {c === 'all' ? `All (${docs.length})` : c}
            </button>
          ))}
        </div>
      )}

      {/* Document grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{docs.length === 0 ? 'No documents yet. Add the first document.' : 'No documents in this category.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <FileIcon type={doc.fileType} cls="w-9 h-9" />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.fileUrl && !doc.fileUrl.startsWith('[') && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => deleteDoc(doc.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-gray-900 text-sm truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CAT_COLORS[doc.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {doc.category}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {doc.uploadedByUser && ` · ${doc.uploadedByUser.firstName} ${doc.uploadedByUser.lastName}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
