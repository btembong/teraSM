import { CheckCircle, XCircle, Shield, GraduationCap, Building2, Calendar } from 'lucide-react'

interface VerifyResult {
  valid:      boolean
  reason?:    string
  type?:      string
  issuedAt?:  string
  docRef?:    string
  student?:   { name: string; email: string }
  institution?: { name: string; logoUrl: string | null }
  summary?:   { cgpa: string; totalCredits: number; courseCount: number }
}

async function verify(code: string): Promise<VerifyResult> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/public/verify/${encodeURIComponent(code)}`, {
      cache: 'no-store',
    })
    return await res.json()
  } catch {
    return { valid: false, reason: 'Verification service unavailable' }
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const result   = await verify(code)

  if (!result.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verification Failed</h1>
          <p className="text-gray-500 mt-2">{result.reason ?? 'This document could not be verified.'}</p>
          <div className="mt-6 p-4 bg-red-50 rounded-xl text-sm text-red-700">
            This may mean the document was altered, the code is incorrect, or the document has been revoked.
          </div>
          <p className="mt-4 text-xs text-gray-400">Powered by Tera SM · Document Verification System</p>
        </div>
      </div>
    )
  }

  const isOfficial = result.type === 'OFFICIAL'
  const issued = result.issuedAt
    ? new Date(result.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Document Verification</p>
              <h1 className="text-lg font-bold">Authenticity Confirmed</h1>
            </div>
          </div>
        </div>

        {/* Valid badge */}
        <div className="flex items-center gap-3 px-6 py-4 bg-green-50 border-b border-green-100">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              {isOfficial ? 'Official Transcript' : 'Unofficial Transcript'} — Verified ✓
            </p>
            <p className="text-xs text-green-600">This document was issued by {result.institution?.name} and has not been tampered with.</p>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Institution */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              {result.institution?.logoUrl
                ? <img src={result.institution.logoUrl} alt="" className="w-8 h-8 object-contain" />
                : <Building2 className="w-5 h-5 text-blue-600" />
              }
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Issuing Institution</p>
              <p className="font-semibold text-gray-900">{result.institution?.name}</p>
            </div>
          </div>

          {/* Student */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Student</p>
              <p className="font-semibold text-gray-900">{result.student?.name}</p>
              <p className="text-xs text-gray-500">{result.student?.email}</p>
            </div>
          </div>

          {/* Document meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Document Type</p>
              <p className="font-semibold text-gray-900 mt-1">{isOfficial ? 'Official Transcript' : 'Unofficial Transcript'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Issued</p>
              </div>
              <p className="font-semibold text-gray-900">{issued}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Document Ref</p>
              <p className="font-semibold text-gray-900 font-mono text-sm mt-1">{result.docRef}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Cumulative GPA</p>
              <p className="font-bold text-blue-600 text-xl mt-0.5">{result.summary?.cgpa}</p>
            </div>
          </div>

          {/* Academic summary */}
          <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4">
            <div className="text-center flex-1">
              <p className="text-xs text-blue-500 uppercase tracking-wide">Courses</p>
              <p className="text-2xl font-bold text-blue-700">{result.summary?.courseCount}</p>
            </div>
            <div className="w-px h-10 bg-blue-100" />
            <div className="text-center flex-1">
              <p className="text-xs text-blue-500 uppercase tracking-wide">Credits Earned</p>
              <p className="text-2xl font-bold text-blue-700">{result.summary?.totalCredits}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-400">
            Verified via Tera SM Document Authentication · {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>
    </div>
  )
}
