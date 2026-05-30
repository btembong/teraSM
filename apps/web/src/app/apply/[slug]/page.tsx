'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle, Upload, X, FileText, ExternalLink } from 'lucide-react'

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
const LEVELS  = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Postgraduate', 'PhD']

const DOC_SLOTS = [
  { key: 'ID_CARD',        label: 'ID Card / Passport',     required: true,  accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'PASSPORT_PHOTO', label: 'Passport Photograph',    required: true,  accept: '.jpg,.jpeg,.png' },
  { key: 'CERTIFICATE',    label: 'Academic Certificate(s)', required: true,  accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'TRANSCRIPT',     label: 'Academic Transcript',     required: false, accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'RECOMMENDATION', label: 'Recommendation Letter',   required: false, accept: '.pdf,.doc,.docx' },
]

type Step      = 1 | 2 | 3 | 4 | 5
type DocFile   = { docType: string; fileName: string; fileSize: number; file: File; uploading?: boolean; fileUrl?: string; error?: string }
type School    = { name: string; logoUrl?: string; programs: { name: string; code: string; level: string }[] }

export default function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug]         = useState('')
  const [school, setSchool]     = useState<School | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep]             = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [refNum, setRefNum]         = useState('')
  const [trackToken, setTrackToken] = useState('')
  const [error, setError]           = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', nationality: '',
    address: '', programOfInterest: '', entryLevel: '',
    previousSchool: '', qualifications: '', personalStatement: '',
  })

  const [docs, setDocs] = useState<Partial<Record<string, DocFile>>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug)
      fetch(`/api/apply/${p.slug}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => setSchool(d))
        .catch(() => setNotFound(true))
    })
  }, [params])

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = async (docType: string, file: File | null) => {
    if (!file) {
      setDocs(d => { const n = { ...d }; delete n[docType]; return n })
      return
    }
    // Immediately show the file as "uploading"
    setDocs(d => ({ ...d, [docType]: { docType, fileName: file.name, fileSize: file.size, file, uploading: true } }))

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('docType', docType)
      const res  = await fetch(`/api/apply/${slug}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setDocs(d => ({ ...d, [docType]: { docType, fileName: file.name, fileSize: file.size, file, uploading: false, error: data.error ?? 'Upload failed' } }))
        return
      }
      setDocs(d => ({ ...d, [docType]: { docType, fileName: file.name, fileSize: file.size, file, uploading: false, fileUrl: data.fileUrl } }))
    } catch {
      setDocs(d => ({ ...d, [docType]: { docType, fileName: file.name, fileSize: file.size, file, uploading: false, error: 'Network error' } }))
    }
  }

  const validateStep = (): string => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email) return 'First name, last name and email are required.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.'
    }
    if (step === 2) {
      if (!form.programOfInterest) return 'Please select a program of interest.'
    }
    if (step === 3) {
      const missing = DOC_SLOTS.filter(s => s.required && !docs[s.key])
      if (missing.length) return `Please upload: ${missing.map(s => s.label).join(', ')}`
      const uploading = DOC_SLOTS.some(s => docs[s.key]?.uploading)
      if (uploading) return 'Please wait for all uploads to complete.'
      const failed = DOC_SLOTS.filter(s => docs[s.key]?.error)
      if (failed.length) return `Upload failed for: ${failed.map(s => s.label).join(', ')}. Please re-upload.`
    }
    if (step === 4) {
      if (form.personalStatement.split(/\s+/).filter(Boolean).length < 100) {
        return 'Personal statement must be at least 100 words.'
      }
    }
    return ''
  }

  const nextStep = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => (s + 1) as Step)
  }

  const submit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const docList = Object.values(docs)
        .filter(Boolean)
        .map(d => ({
          docType:  d!.docType,
          fileName: d!.fileName,
          fileSize: d!.fileSize,
          fileUrl:  d!.fileUrl ?? '',
        }))

      const res = await fetch(`/api/apply/${slug}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, documents: docList }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.trackingToken) {
          setError('You\'ve already applied. Track your application →')
          setTrackToken(data.trackingToken)
          return
        }
        setError(data.error ?? 'Submission failed.')
        return
      }
      setRefNum(data.referenceNumber)
      setTrackToken(data.trackingToken)
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const wordCount = form.personalStatement.split(/\s+/).filter(Boolean).length

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</p>
          <p className="text-gray-500 text-sm">This institution's application portal is not available.</p>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const inp   = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
  const lbl   = 'block text-xs font-medium text-gray-600 mb-1'
  const STEPS = ['Personal Info', 'Academic', 'Documents', 'Statement', 'Review']

  // Build program options — use real programs if available, fall back to generic
  const programOptions = school.programs?.length
    ? school.programs.map(p => p.name)
    : ['Computer Science', 'Information Technology', 'Engineering', 'Business Administration',
       'Accounting', 'Economics', 'Medicine', 'Nursing', 'Law', 'Education', 'Other']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow mb-4 overflow-hidden">
            {school.logoUrl
              ? <img src={school.logoUrl} alt="logo" className="w-10 h-10 object-contain" />
              : <span className="text-white text-xl font-bold">{school.name[0]}</span>
            }
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Admission Application</p>
        </div>

        {/* Progress */}
        {!submitted && (
          <div className="flex items-center justify-center gap-1.5 mb-8 overflow-x-auto pb-1">
            {STEPS.map((label, i) => {
              const s      = (i + 1) as Step
              const active = step === s
              const done   = step > s
              return (
                <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${
                    done   ? 'bg-blue-100 text-blue-700' :
                    active ? 'bg-blue-600 text-white shadow' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <span className="font-bold">{done ? '✓' : s}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-1">Application Submitted!</h2>
              <p className="text-gray-500 text-sm mb-4">
                Your reference number is{' '}
                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{refNum}</span>
              </p>
              <p className="text-gray-400 text-xs mb-6 max-w-xs mx-auto">
                A confirmation email will be sent to <strong>{form.email}</strong>. Use the link below to track your application status.
              </p>
              <a
                href={`/apply/${slug}/track/${trackToken}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Track My Application
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── Step 1: Personal Info ── */}
              {step === 1 && (
                <>
                  <h2 className="font-semibold text-gray-900">Personal Information</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>First Name *</label><input className={inp} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" /></div>
                    <div><label className={lbl}>Last Name *</label><input className={inp} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" /></div>
                  </div>
                  <div><label className={lbl}>Email Address *</label><input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john.doe@email.com" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>Phone Number</label><input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 800 000 0000" /></div>
                    <div><label className={lbl}>Date of Birth</label><input className={inp} type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Gender</label>
                      <select className={inp} value={form.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">Select...</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div><label className={lbl}>Nationality</label><input className={inp} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Nigerian" /></div>
                  </div>
                  <div><label className={lbl}>Home Address</label><input className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street, Lagos" /></div>
                </>
              )}

              {/* ── Step 2: Academic Background ── */}
              {step === 2 && (
                <>
                  <h2 className="font-semibold text-gray-900">Academic Background</h2>
                  <div>
                    <label className={lbl}>Program of Interest *</label>
                    <select className={inp} value={form.programOfInterest} onChange={e => set('programOfInterest', e.target.value)}>
                      <option value="">Select program...</option>
                      {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Entry Level</label>
                    <select className={inp} value={form.entryLevel} onChange={e => set('entryLevel', e.target.value)}>
                      <option value="">Select level...</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Previous School / Institution</label><input className={inp} value={form.previousSchool} onChange={e => set('previousSchool', e.target.value)} placeholder="Name of school" /></div>
                  <div>
                    <label className={lbl}>Qualifications & Grades</label>
                    <textarea className={`${inp} resize-none`} rows={4} value={form.qualifications} onChange={e => set('qualifications', e.target.value)}
                      placeholder="e.g. WAEC: A1 in Mathematics, B2 in English..." />
                  </div>
                </>
              )}

              {/* ── Step 3: Document Upload ── */}
              {step === 3 && (
                <>
                  <h2 className="font-semibold text-gray-900">Document Upload</h2>
                  <p className="text-xs text-gray-500">Upload clear, legible copies of your documents. Max 10 MB per file. Accepted: JPG, PNG, PDF.</p>
                  <div className="space-y-3">
                    {DOC_SLOTS.map(slot => {
                      const uploaded = docs[slot.key]
                      const hasError = !!uploaded?.error
                      return (
                        <div key={slot.key} className={`border rounded-xl p-3 transition-colors ${
                          uploaded && !hasError && !uploaded.uploading ? 'border-green-200 bg-green-50' :
                          hasError                                     ? 'border-red-200 bg-red-50' :
                          'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-800">
                              {slot.label}
                              {slot.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            {uploaded && (
                              <button
                                onClick={() => {
                                  handleFile(slot.key, null)
                                  if (fileRefs.current[slot.key]) fileRefs.current[slot.key]!.value = ''
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {uploaded ? (
                            <div className="flex items-center gap-2 text-xs">
                              {uploaded.uploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                  <span className="text-blue-600">Uploading {uploaded.fileName}…</span>
                                </>
                              ) : hasError ? (
                                <>
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-red-600">{uploaded.error} — click × to retry</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4 text-green-600" />
                                  <span className="text-green-700 truncate">{uploaded.fileName}</span>
                                  <span className="text-green-500 flex-shrink-0">({(uploaded.fileSize / 1024).toFixed(0)} KB)</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-blue-600 transition-colors">
                              <Upload className="w-4 h-4" />
                              <span>Click to upload</span>
                              <input
                                type="file"
                                accept={slot.accept}
                                className="sr-only"
                                ref={el => { fileRefs.current[slot.key] = el }}
                                onChange={e => handleFile(slot.key, e.target.files?.[0] ?? null)}
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── Step 4: Personal Statement ── */}
              {step === 4 && (
                <>
                  <h2 className="font-semibold text-gray-900">Personal Statement</h2>
                  <p className="text-xs text-gray-500">
                    Tell us about yourself, your motivation for applying, and your future goals. Minimum 100 words.
                  </p>
                  <textarea
                    className={`${inp} resize-none`}
                    rows={10}
                    value={form.personalStatement}
                    onChange={e => set('personalStatement', e.target.value)}
                    placeholder="Write your personal statement here..."
                  />
                  <p className={`text-xs text-right ${wordCount >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                    {wordCount} word{wordCount !== 1 ? 's' : ''} {wordCount < 100 ? `(${100 - wordCount} more needed)` : '✓'}
                  </p>
                </>
              )}

              {/* ── Step 5: Review & Submit ── */}
              {step === 5 && (
                <>
                  <h2 className="font-semibold text-gray-900">Review & Submit</h2>
                  <p className="text-xs text-gray-500 mb-4">Please review your application before submitting.</p>

                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[['Name', `${form.firstName} ${form.lastName}`], ['Email', form.email], ['Phone', form.phone || '—'], ['Gender', form.gender || '—'], ['Nationality', form.nationality || '—']].map(([k, v]) => (
                          <div key={k}><span className="text-xs text-gray-400">{k}: </span><span className="font-medium text-gray-800">{v}</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Academic</p>
                      {[['Program', form.programOfInterest || '—'], ['Level', form.entryLevel || '—'], ['Previous School', form.previousSchool || '—']].map(([k, v]) => (
                        <div key={k}><span className="text-xs text-gray-400">{k}: </span><span className="font-medium text-gray-800">{v}</span></div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Documents</p>
                      {DOC_SLOTS.map(slot => (
                        <div key={slot.key} className="flex items-center gap-2 text-xs py-0.5">
                          <span className={docs[slot.key]?.fileUrl ? 'text-green-500' : docs[slot.key] ? 'text-amber-500' : 'text-red-400'}>
                            {docs[slot.key]?.fileUrl ? '✓' : docs[slot.key] ? '↑' : '✗'}
                          </span>
                          <span className="text-gray-600">{slot.label}</span>
                          {docs[slot.key] && <span className="text-gray-400 truncate">{docs[slot.key]!.fileName}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Statement</p>
                      <p className="text-xs text-gray-600 line-clamp-3">{form.personalStatement || '—'}</p>
                      <p className="text-xs text-gray-400 mt-1">{wordCount} words</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    By submitting, you confirm that all information provided is accurate and complete.
                  </p>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {error}
                    {trackToken && (
                      <a href={`/apply/${slug}/track/${trackToken}`} className="ml-1 underline font-medium">
                        Track application
                      </a>
                    )}
                  </span>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                {step > 1
                  ? <button onClick={() => { setStep(s => (s - 1) as Step); setError('') }} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50">
                      ← Back
                    </button>
                  : <span />
                }
                {step < 5
                  ? <button onClick={nextStep} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      Continue →
                    </button>
                  : <button onClick={submit} disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Submit Application
                    </button>
                }
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-blue-600">Tera SM</span>
        </p>
      </div>
    </div>
  )
}
