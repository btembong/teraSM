'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Users, Send, Loader2, CheckCircle2, ChevronDown } from 'lucide-react'

const SEGMENTS = [
  { value: 'all',    label: 'All schools' },
  { value: 'trial',  label: 'Trial schools only' },
  { value: 'active', label: 'Active (paid) schools only' },
  { value: 'plan',   label: 'By plan…' },
]

const PLANS = ['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY']

export default function CampaignsPage() {
  const [subject,   setSubject]   = useState('')
  const [headline,  setHeadline]  = useState('')
  const [body,      setBody]      = useState('')
  const [ctaText,   setCtaText]   = useState('')
  const [ctaUrl,    setCtaUrl]    = useState('')
  const [segment,   setSegment]   = useState('all')
  const [plan,      setPlan]      = useState('PRO')

  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount,   setLoadingCount]   = useState(false)
  const [sending,        setSending]        = useState(false)
  const [result,         setResult]         = useState<{ sent: number } | null>(null)
  const [error,          setError]          = useState('')

  // Fetch recipient count whenever segment/plan changes
  useEffect(() => {
    setRecipientCount(null)
    setLoadingCount(true)
    const params = new URLSearchParams({ segment })
    if (segment === 'plan') params.set('plan', plan)
    fetch(`/api/super-admin/campaigns?${params}`)
      .then(r => r.json())
      .then(d => setRecipientCount(d.count ?? 0))
      .catch(() => setRecipientCount(null))
      .finally(() => setLoadingCount(false))
  }, [segment, plan])

  const handleSend = async () => {
    if (!subject.trim() || !headline.trim() || !body.trim()) {
      setError('Subject, headline and body are required.')
      return
    }
    setError('')
    setSending(true)
    setResult(null)
    const res = await fetch('/api/super-admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, headline, body, ctaText, ctaUrl, segment, plan }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to send campaign.')
    } else {
      setResult(data)
      setSubject(''); setHeadline(''); setBody(''); setCtaText(''); setCtaUrl('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-900/50 rounded-2xl flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Email Campaigns</h1>
          <p className="text-sm text-gray-400">Send a broadcast email to school admins</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Compose form */}
        <div className="col-span-2 space-y-4">

          {/* Audience */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" /> Audience
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {SEGMENTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                    segment === s.value
                      ? 'bg-violet-900/60 border-violet-600 text-violet-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {segment === 'plan' && (
              <div className="relative">
                <select
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  className="w-full h-10 pl-4 pr-8 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 outline-none appearance-none"
                >
                  {PLANS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-3.5 h-3.5" />
              {loadingCount
                ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Counting…</span>
                : recipientCount !== null
                  ? <span><strong className="text-white">{recipientCount}</strong> recipient{recipientCount !== 1 ? 's' : ''} will receive this email</span>
                  : <span>—</span>
              }
            </div>
          </div>

          {/* Email content */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-gray-500" /> Email Content
            </h2>

            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Subject line *</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Exciting new features in Tera SM"
                className="w-full h-10 px-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-600 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Headline *</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. Big news for your school"
                className="w-full h-10 px-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-600 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Body *</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message here. HTML is supported for formatting."
                rows={8}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-600 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">CTA Button text (optional)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={e => setCtaText(e.target.value)}
                  placeholder="e.g. See What's New"
                  className="w-full h-10 px-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-600 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">CTA URL (optional)</label>
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={e => setCtaUrl(e.target.value)}
                  placeholder="https://terasms.com/..."
                  className="w-full h-10 px-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {result && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-950/40 border border-green-900/50 rounded-lg px-4 py-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Campaign sent to <strong className="text-green-300">{result.sent}</strong> recipient{result.sent !== 1 ? 's' : ''}.
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !headline.trim() || !body.trim()}
              className="w-full h-11 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send Campaign</>
              }
            </button>
          </div>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Tips</h3>
            <ul className="space-y-2.5 text-xs text-gray-500 leading-relaxed">
              <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> Keep subject lines under 50 characters for best open rates.</li>
              <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> Address recipients by name — the email template automatically inserts their first name.</li>
              <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> HTML is supported in the body — use <code className="bg-gray-800 px-1 rounded">&lt;strong&gt;</code>, <code className="bg-gray-800 px-1 rounded">&lt;br&gt;</code>, etc.</li>
              <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> Add a CTA button to drive clicks to a specific page or feature.</li>
              <li className="flex gap-2"><span className="text-violet-400 flex-shrink-0">→</span> All emails include an unsubscribe link automatically.</li>
            </ul>
          </div>

          <div className="bg-amber-950/30 border border-amber-900/40 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-amber-300 mb-2">Before you send</h3>
            <ul className="space-y-1.5 text-xs text-amber-700/80">
              <li>• Double-check recipient count above</li>
              <li>• Campaigns are irreversible once sent</li>
              <li>• Emails are sent from hello@terasms.com</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
