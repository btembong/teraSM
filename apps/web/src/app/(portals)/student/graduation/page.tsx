'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap, CheckCircle2, XCircle, Loader2, AlertCircle,
  Clock, Award, BookOpen, DollarSign, Info, Send,
} from 'lucide-react'

interface EligibilityCheck {
  pass:  boolean
  label: string
  value: string
}

interface GraduationData {
  eligible: boolean
  checks: {
    level:   EligibilityCheck
    credits: EligibilityCheck
    cgpa:    EligibilityCheck
    fees:    EligibilityCheck
  }
  profile: {
    level:          number
    cgpa:           number
    totalCredits:   number
    graduatedAt:    string | null
    programName:    string | null
    requiredCredits: number
  }
  application: {
    id:             string
    status:         string
    appliedAt:      string
    graduationDate: string | null
    gownSize:       string | null
    notes:          string | null
    rejectionReason: string | null
    reviewedAt:     string | null
  } | null
}

const GOWN_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  APPLIED:      { color: 'bg-blue-50 border-blue-100 text-blue-700',     label: 'Application Received',  icon: <Clock className="w-5 h-5 text-blue-500" /> },
  UNDER_REVIEW: { color: 'bg-amber-50 border-amber-100 text-amber-700',  label: 'Under Review',          icon: <Clock className="w-5 h-5 text-amber-500" /> },
  APPROVED:     { color: 'bg-emerald-50 border-emerald-100 text-emerald-700', label: 'Approved',          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
  REJECTED:     { color: 'bg-red-50 border-red-100 text-red-700',        label: 'Not Approved',          icon: <XCircle className="w-5 h-5 text-red-500" /> },
  GRADUATED:    { color: 'bg-indigo-50 border-indigo-100 text-indigo-700', label: 'Graduated',            icon: <GraduationCap className="w-5 h-5 text-indigo-500" /> },
}

const CHECK_ICON: Record<string, React.ReactNode> = {
  level:   <Award className="w-4 h-4" />,
  credits: <BookOpen className="w-4 h-4" />,
  cgpa:    <GraduationCap className="w-4 h-4" />,
  fees:    <DollarSign className="w-4 h-4" />,
}

export default function StudentGraduationPage() {
  const [data, setData]         = useState<GraduationData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [gownSize, setGownSize] = useState('M')
  const [notes, setNotes]       = useState('')
  const [applying, setApplying] = useState(false)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/student/graduation')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function apply() {
    setApplying(true)
    try {
      const res = await fetch('/api/student/graduation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gownSize, notes: notes || null }),
      })
      if (res.ok) {
        showToast('Graduation application submitted successfully', 'ok')
        await load()
      } else {
        const err = await res.json()
        showToast(err.error ?? 'Application failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-24 text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Unable to load graduation information.</p>
      </div>
    )
  }

  const { eligible, checks, profile, application } = data
  const isGraduated = profile.graduatedAt !== null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Graduation</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {profile.programName ?? 'Your program'} · Level {profile.level}
        </p>
      </div>

      {/* Graduated banner */}
      {isGraduated && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-6 text-center">
          <GraduationCap className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
          <p className="text-xl font-bold text-indigo-900">Congratulations, Graduate!</p>
          <p className="text-sm text-indigo-600 mt-1">
            You officially graduated on{' '}
            <strong>{new Date(profile.graduatedAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <a
              href="/student/transcript"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Download Transcript
            </a>
          </div>
        </div>
      )}

      {/* Application status */}
      {application && !isGraduated && (
        <div className={`border rounded-2xl px-5 py-4 flex items-start gap-3 ${STATUS_CONFIG[application.status]?.color}`}>
          {STATUS_CONFIG[application.status]?.icon}
          <div className="flex-1">
            <p className="font-semibold text-sm">{STATUS_CONFIG[application.status]?.label}</p>
            <p className="text-xs mt-0.5 opacity-80">
              Applied on {new Date(application.appliedAt).toLocaleDateString()}
              {application.reviewedAt && ` · Reviewed ${new Date(application.reviewedAt).toLocaleDateString()}`}
            </p>
            {application.graduationDate && (
              <p className="text-xs mt-1 font-medium">
                Graduation date: {new Date(application.graduationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            {application.gownSize && (
              <p className="text-xs mt-0.5">Gown size: {application.gownSize}</p>
            )}
            {application.rejectionReason && (
              <div className="mt-2 p-3 bg-white/60 rounded-xl text-xs">
                <p className="font-semibold mb-0.5">Reason:</p>
                <p>{application.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eligibility checklist */}
      {!isGraduated && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <p className="font-semibold text-gray-900 text-sm">Graduation Eligibility</p>
            {eligible ? (
              <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Eligible
              </span>
            ) : (
              <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Requirements Pending
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {Object.entries(checks).map(([key, check]) => (
              <div key={key} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  check.pass ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'
                }`}>
                  {CHECK_ICON[key]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{check.label}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-semibold ${check.pass ? 'text-emerald-600' : 'text-red-500'}`}>
                    {check.value}
                  </span>
                  {check.pass
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application form — only show if eligible and no application yet */}
      {eligible && !application && !isGraduated && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Apply for Graduation</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Submit your graduation application for the registrar to review
            </p>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
              <p>
                Your application will be reviewed by the registrar. Once approved, you will receive your graduation date and further ceremony details.
                Your official transcript and degree certificate will be available after you are marked as graduated.
              </p>
            </div>

            {/* Gown size */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Gown Size</label>
              <div className="flex gap-2 flex-wrap">
                {GOWN_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setGownSize(size)}
                    className={`w-12 h-10 rounded-xl border text-sm font-semibold transition-colors ${
                      gownSize === size
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Additional Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requirements or information for the registrar…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <button
              onClick={apply}
              disabled={applying}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Application
            </button>
          </div>
        </div>
      )}

      {/* Not yet eligible notice */}
      {!eligible && !application && !isGraduated && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold mb-0.5">Not yet eligible to apply</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Complete all requirements above to unlock your graduation application. Contact your academic advisor if you believe this is an error.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
