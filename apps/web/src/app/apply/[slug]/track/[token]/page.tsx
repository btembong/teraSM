'use client'

import { useEffect, useState } from 'react'
import {
  Loader2, CheckCircle2, Clock, XCircle, AlertCircle,
  FileText, Users, Star, Download, ThumbsUp, ThumbsDown,
} from 'lucide-react'

type AppData = {
  referenceNumber:   string
  firstName:         string
  lastName:          string
  programOfInterest: string | null
  entryLevel:        string | null
  status:            string
  waitlistPosition:  number | null
  offerExpiry:       string | null
  offerLetterUrl:    string | null
  rejectionReason:   string | null
  enrolledAt:        string | null
  createdAt:         string
  school:            { name: string; logoUrl?: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  SUBMITTED:     { label: 'Submitted',         color: 'text-gray-600 bg-gray-100',    icon: <Clock className="w-6 h-6" />,        desc: 'Your application has been received and is queued for review.' },
  DOCS_REVIEW:   { label: 'Documents Review',  color: 'text-amber-700 bg-amber-100',  icon: <FileText className="w-6 h-6" />,     desc: 'Our team is reviewing your uploaded documents.' },
  REVIEWING:     { label: 'Under Review',      color: 'text-blue-700 bg-blue-100',    icon: <Users className="w-6 h-6" />,        desc: 'The admissions committee is reviewing your application.' },
  INTERVIEW:     { label: 'Interview Stage',   color: 'text-purple-700 bg-purple-100',icon: <Users className="w-6 h-6" />,        desc: 'You have been shortlisted for an interview. Watch your email.' },
  DOCS_VERIFIED: { label: 'Documents Verified',color: 'text-teal-700 bg-teal-100',   icon: <CheckCircle2 className="w-6 h-6" />, desc: 'Your documents have been verified. A decision is pending.' },
  OFFERED:       { label: 'Offer Extended',    color: 'text-green-700 bg-green-100',  icon: <Star className="w-6 h-6" />,         desc: 'Congratulations! You have received an admission offer.' },
  WAITLISTED:    { label: 'Waitlisted',        color: 'text-orange-700 bg-orange-100',icon: <Clock className="w-6 h-6" />,        desc: 'You are on the waitlist. You will be notified if a place becomes available.' },
  ACCEPTED:      { label: 'Enrolled',          color: 'text-green-700 bg-green-100',  icon: <CheckCircle2 className="w-6 h-6" />, desc: 'Welcome! Your enrollment is confirmed.' },
  REJECTED:      { label: 'Unsuccessful',      color: 'text-red-700 bg-red-100',      icon: <XCircle className="w-6 h-6" />,      desc: 'We regret to inform you that your application was unsuccessful at this time.' },
  WITHDRAWN:     { label: 'Withdrawn',         color: 'text-gray-500 bg-gray-100',    icon: <XCircle className="w-6 h-6" />,      desc: 'This application has been withdrawn.' },
}

const TIMELINE = [
  'SUBMITTED', 'DOCS_REVIEW', 'REVIEWING', 'DOCS_VERIFIED', 'OFFERED', 'ACCEPTED',
]

function timelineIndex(status: string) {
  if (status === 'WAITLISTED') return 4  // same as OFFERED position
  if (status === 'INTERVIEW')  return 2
  if (status === 'REJECTED' || status === 'WITHDRAWN') return -1
  return TIMELINE.indexOf(status)
}

export default function TrackPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const [slug, setSlug]     = useState('')
  const [token, setToken]   = useState('')
  const [data, setData]     = useState<AppData | null>(null)
  const [notFound, setNotFound]   = useState(false)
  const [responding, setResponding] = useState(false)
  const [respondError, setRespondError] = useState('')

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug)
      setToken(p.token)
      fetch(`/api/apply/${p.slug}/track/${p.token}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => setData(d))
        .catch(() => setNotFound(true))
    })
  }, [params])

  const [conditionsAgreed, setConditionsAgreed] = useState(false)

  const respond = async (action: 'ACCEPT' | 'DECLINE') => {
    setResponding(true)
    setRespondError('')
    try {
      const res  = await fetch(`/api/apply/${slug}/track/${token}/respond`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) { setRespondError(json.error ?? 'Failed. Please try again.'); return }
      setData(d => d ? { ...d, status: json.status, enrolledAt: json.enrolledAt } : d)
    } catch {
      setRespondError('Network error. Please try again.')
    } finally {
      setResponding(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-900 mb-2">Application Not Found</p>
          <p className="text-gray-500 text-sm">The tracking link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const cfg      = STATUS_CONFIG[data.status] ?? STATUS_CONFIG['SUBMITTED']
  const tlIndex  = timelineIndex(data.status)
  const isRejected = data.status === 'REJECTED' || data.status === 'WITHDRAWN'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* School header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl shadow mb-3 overflow-hidden">
            {data.school.logoUrl
              ? <img src={data.school.logoUrl} alt="logo" className="w-8 h-8 object-contain" />
              : <span className="text-white text-lg font-bold">{data.school.name[0]}</span>
            }
          </div>
          <h1 className="text-lg font-bold text-gray-900">{data.school.name}</h1>
          <p className="text-gray-500 text-xs mt-0.5">Application Tracker</p>
        </div>

        {/* Main status card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
              {cfg.icon}
            </div>
            <div>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1 ${cfg.color}`}>
                {cfg.label}
              </div>
              <p className="text-sm text-gray-600">{cfg.desc}</p>
            </div>
          </div>

          {/* Ref number + name */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Reference</p>
                <p className="font-bold text-gray-900">{data.referenceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Applicant</p>
                <p className="font-medium text-gray-900">{data.firstName} {data.lastName}</p>
              </div>
              {data.programOfInterest && (
                <div>
                  <p className="text-xs text-gray-400">Program</p>
                  <p className="font-medium text-gray-900">{data.programOfInterest}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Applied</p>
                <p className="font-medium text-gray-900">{new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Waitlist position */}
          {data.status === 'WAITLISTED' && data.waitlistPosition && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 text-center">
              <p className="text-orange-700 font-semibold">Waitlist Position</p>
              <p className="text-3xl font-black text-orange-600">#{data.waitlistPosition}</p>
              <p className="text-xs text-orange-500 mt-1">You will be notified automatically if a place opens.</p>
            </div>
          )}

          {/* Offer actions */}
          {data.status === 'OFFERED' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <p className="font-semibold text-green-800 mb-1">You have an admission offer!</p>
              {data.offerExpiry && (
                <p className="text-xs text-green-600 mb-3">
                  Offer expires: <strong>{new Date(data.offerExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
              )}
              <div className="flex gap-2 flex-wrap mb-3">
                {data.offerLetterUrl && (
                  <a
                    href={data.offerLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Offer Letter
                  </a>
                )}
              </div>
              {/* Conditions acknowledgment */}
              <div className="bg-white border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">By accepting this offer, you confirm that:</p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3 list-none">
                  {[
                    'All information provided in your application is accurate and truthful.',
                    'You understand that your enrolment is subject to fee payment as invoiced.',
                    'You agree to abide by the institution\'s rules, regulations and code of conduct.',
                    'You understand that providing false information may result in withdrawal of this offer.',
                  ].map(c => (
                    <li key={c} className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">•</span> {c}
                    </li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conditionsAgreed}
                    onChange={e => setConditionsAgreed(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-medium text-gray-700">I have read and agree to the above conditions</span>
                </label>
              </div>

              <p className="text-xs text-green-700 mb-2 font-medium">Respond to your offer:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => respond('ACCEPT')}
                  disabled={responding || !conditionsAgreed}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  {responding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                  Accept Offer
                </button>
                <button
                  onClick={() => respond('DECLINE')}
                  disabled={responding}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  {responding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                  Decline
                </button>
              </div>
              {respondError && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {respondError}
                </p>
              )}
            </div>
          )}

          {/* Rejection reason */}
          {data.status === 'REJECTED' && data.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-600 font-medium mb-1">Feedback from admissions:</p>
              <p className="text-sm text-red-700">{data.rejectionReason}</p>
            </div>
          )}

          {/* Enrolled */}
          {data.status === 'ACCEPTED' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-800">Enrollment Confirmed</p>
              {data.enrolledAt && (
                <p className="text-xs text-green-600">
                  Since {new Date(data.enrolledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <p className="text-xs text-green-700 mt-2">Check your email for your login credentials.</p>
            </div>
          )}

          {/* Progress timeline */}
          {!isRejected && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Application Progress</p>
              <div className="flex items-center gap-0">
                {['Submitted', 'Docs Review', 'Reviewing', 'Verified', 'Offered', 'Enrolled'].map((label, i) => {
                  const done    = tlIndex > i
                  const current = tlIndex === i
                  return (
                    <div key={label} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          done    ? 'bg-blue-600 text-white' :
                          current ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600' :
                          'bg-gray-100 text-gray-300'
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-[9px] mt-1 text-center leading-tight max-w-[40px] ${current ? 'text-blue-600 font-semibold' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                          {label}
                        </span>
                      </div>
                      {i < 5 && (
                        <div className={`h-0.5 flex-1 mx-0.5 ${done || current ? 'bg-blue-200' : 'bg-gray-100'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Powered by <span className="font-semibold text-blue-600">Tera SM</span>
        </p>
      </div>
    </div>
  )
}
