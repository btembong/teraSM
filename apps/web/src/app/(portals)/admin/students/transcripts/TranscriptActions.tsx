'use client'

import { useState, useEffect } from 'react'
import {
  Shield, FileText, Download, CheckCircle, ExternalLink,
  ChevronDown, ChevronRight, Clock, Loader2,
} from 'lucide-react'

interface TranscriptRequest {
  id: string
  type: 'OFFICIAL' | 'UNOFFICIAL'
  status: 'PENDING' | 'READY' | 'DOWNLOADED'
  issuedAt: string
  pdfUrl: string | null
  verificationCode: string
  purpose: string | null
}

function statusBadge(status: string) {
  if (status === 'READY')
    return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ready</span>
  if (status === 'DOWNLOADED')
    return <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Downloaded</span>
  return <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
}

function HistoryPanel({ studentId, refresh }: { studentId: string; refresh: number }) {
  const [requests, setRequests] = useState<TranscriptRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [copied, setCopied]     = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/transcript-requests?studentId=${studentId}`)
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [studentId, refresh])

  function copyVerify(code: string) {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${code}`)
    setCopied(code)
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading) return (
    <div className="px-5 pb-4 flex items-center gap-2 text-xs text-slate-400">
      <Loader2 className="w-3 h-3 animate-spin" /> Loading history…
    </div>
  )
  if (requests.length === 0) return (
    <div className="px-5 pb-4 text-xs text-slate-400 italic">No transcripts generated yet.</div>
  )

  return (
    <div className="px-5 pb-4">
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 font-semibold text-slate-500">Type</th>
              <th className="text-left px-4 py-2 font-semibold text-slate-500">Issued</th>
              <th className="text-left px-4 py-2 font-semibold text-slate-500">Purpose</th>
              <th className="text-center px-4 py-2 font-semibold text-slate-500">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/40">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {r.type === 'OFFICIAL'
                      ? <Shield className="w-3.5 h-3.5 text-blue-500" />
                      : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="font-medium text-slate-700">{r.type === 'OFFICIAL' ? 'Official' : 'Unofficial'}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {new Date(r.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{r.purpose ?? '—'}</td>
                <td className="px-4 py-2.5 text-center">{statusBadge(r.status)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    {r.pdfUrl && (
                      <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                        <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                      </a>
                    )}
                    {r.type === 'OFFICIAL' && r.verificationCode && (
                      <button
                        onClick={() => copyVerify(r.verificationCode)}
                        className="p-1 hover:bg-green-50 rounded-lg transition-colors"
                        title="Copy verification URL"
                      >
                        {copied === r.verificationCode
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          : <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-green-600" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StudentTranscriptRow({
  id, name, email, studentIdCode, level, cgpa, totalCredits, requestCount, lastRequest,
}: {
  id: string; name: string; email: string; studentIdCode: string | null
  level: number | null; cgpa: number | null; totalCredits: number; requestCount: number; lastRequest: string | null
}) {
  const [open, setOpen]       = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [count, setCount]     = useState(requestCount)
  const [last, setLast]       = useState(lastRequest)

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/transcript-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to generate')
      } else {
        setCount(c => c + 1)
        setLast(new Date().toISOString())
        setRefresh(r => r + 1)
        setOpen(true)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/40 transition-colors">
        {/* Expand toggle */}
        <button onClick={() => setOpen(o => !o)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
          {open
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Student info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{name}</p>
          <p className="text-xs text-slate-400">
            {email}{studentIdCode ? ` · ${studentIdCode}` : ''}
          </p>
        </div>

        {/* Level */}
        <div className="hidden sm:block">
          {level != null
            ? <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">L{level}</span>
            : <span className="text-xs text-slate-300">—</span>}
        </div>

        {/* CGPA */}
        <div className="w-16 text-center hidden md:block">
          <p className="text-xs text-slate-400 mb-0.5">CGPA</p>
          <p className={`text-sm font-bold ${
            (cgpa ?? 0) >= 3.5 ? 'text-emerald-600'
            : (cgpa ?? 0) >= 2.0 ? 'text-slate-900'
            : 'text-red-500'
          }`}>
            {cgpa != null ? cgpa.toFixed(2) : '—'}
          </p>
        </div>

        {/* Credits */}
        <div className="w-16 text-center hidden lg:block">
          <p className="text-xs text-slate-400 mb-0.5">Credits</p>
          <p className="text-sm font-medium text-slate-700">{totalCredits || '—'}</p>
        </div>

        {/* Request count */}
        <div className="w-24 text-center hidden sm:block">
          {count > 0 ? (
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-600 font-medium">{count} issued</span>
            </div>
          ) : (
            <span className="text-xs text-slate-300">None yet</span>
          )}
          {last && (
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>

        {/* Generate button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
            Generate
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>

      {open && (
        <div className="bg-slate-50/60 border-t border-gray-50">
          <div className="px-5 py-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transcript History</p>
          </div>
          <HistoryPanel studentId={id} refresh={refresh} />
        </div>
      )}
    </div>
  )
}
