'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Send, Mail, Users, ChevronDown, CheckCircle2,
  AlertCircle, Loader2, Eye, X, Megaphone,
} from 'lucide-react'

const AUDIENCES = [
  { value: 'ALL',      label: 'All tenant admins',       desc: 'Every school on the platform' },
  { value: 'TRIAL',    label: 'Trial schools only',      desc: 'Schools currently on free trial' },
  { value: 'PAID',     label: 'Paying schools only',     desc: 'Schools with active subscriptions' },
  { value: 'BY_PLAN',  label: 'Specific plan',           desc: 'Filter by subscription tier' },
]

const PLANS = ['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY']

const TEMPLATES = [
  {
    label: 'Welcome & Getting Started',
    subject: 'Your school portal is ready — here\'s how to get started',
    headline: 'Welcome to Tera SM.',
    body: `We're glad to have you onboard. Your school portal is live and ready to use.\n\nHere's what we recommend doing first:\n\n<strong>1. Upload your school logo</strong> — Go to Settings → Branding to customize your portal with your school's identity.\n\n<strong>2. Invite your staff</strong> — Go to Settings → Users → Invite to bring in your registrar, finance officer, and teachers.\n\n<strong>3. Set up your first semester</strong> — Go to Academics → Calendar to create your academic year and current semester.\n\nIf you run into anything, just reply to this email. We read every message.`,
    ctaText: 'Open My Portal',
    ctaUrl: 'https://app.terasms.com/admin',
  },
  {
    label: '5 Things to Try Today',
    subject: '5 things your school can do on Tera SM today',
    headline: 'Your school portal is more powerful than you think.',
    body: `Most school admins log in, check the dashboard, and stop there. But Tera SM is built to run your entire institution — and there are features already live in your portal that could save your team hours every week.\n\nHere are five things worth trying today:\n\n<strong>01 — Publish your application portal</strong>\nAdmissions → copy your public /apply link and share it on your website.\n\n<strong>02 — Generate a student transcript in seconds</strong>\nStudents → select a student → Transcripts → Download.\n\n<strong>03 — Send a fee invoice to every student at once</strong>\nFinance → Invoices → Bulk Generate.\n\n<strong>04 — Upload your school logo and brand color</strong>\nSettings → Branding. Your logo appears everywhere immediately.\n\n<strong>05 — Invite your first staff member</strong>\nSettings → Users → Invite.`,
    ctaText: 'Open My Portal',
    ctaUrl: 'https://app.terasms.com/admin',
  },
  {
    label: 'Personal Note from the Team',
    subject: 'A personal note from the Tera SM team',
    headline: 'We\'re building this with you.',
    body: `I want to be honest with you about something.\n\nWhen we started building Tera SM, we knew schools in Africa and beyond were underserved. Paper records, WhatsApp groups for fee reminders, Excel sheets for grades, physical queues for transcripts — institutions doing incredible work, held back by tools that weren't built for them.\n\nWe set out to fix that. Not with a generic product adapted from elsewhere, but with something built ground-up for how schools here actually operate.\n\nAs a school on Tera SM from the beginning, you get early access to every new feature before anyone else. No extra charge. No waitlist.\n\nOne ask: if there is anything — a feature you need, something not working the way you expected, or just feedback on what we've built — please tell us. Reply to this email. We read every message personally.\n\nThank you for being here from the start.`,
    ctaText: 'Share Your Feedback',
    ctaUrl: 'mailto:hello@terasms.com',
  },
]

export default function CampaignsPage() {
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

  const [subject,   setSubject]   = useState('')
  const [headline,  setHeadline]  = useState('')
  const [body,      setBody]      = useState('')
  const [ctaText,   setCtaText]   = useState('')
  const [ctaUrl,    setCtaUrl]    = useState('')
  const [audience,  setAudience]  = useState('ALL')
  const [plan,      setPlan]      = useState('PRO')
  const [sending,   setSending]   = useState(false)
  const [result,    setResult]    = useState<{ sent: number; failed: string[]; total: number } | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [preview,   setPreview]   = useState(false)
  const [template,  setTemplate]  = useState(-1)

  function applyTemplate(i: number) {
    const t = TEMPLATES[i]
    if (!t) return
    setTemplate(i)
    setSubject(t.subject)
    setHeadline(t.headline)
    setBody(t.body)
    setCtaText(t.ctaText)
    setCtaUrl(t.ctaUrl)
  }

  async function handleSend() {
    if (!subject.trim() || !headline.trim() || !body.trim()) {
      setError('Subject, headline, and body are required.')
      return
    }
    setSending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/campaigns/email-blast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, headline, body, ctaText, ctaUrl, audience, plan }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Send failed.'); return }
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Campaigns</h2>
          <p className="text-sm text-gray-400 mt-0.5">Compose and send emails to school admins on the platform</p>
        </div>
        {!isSuperAdmin && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-700 font-medium">Super admin access required to send</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Compose form ── */}
        <div className="col-span-2 space-y-4">

          {/* Templates */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(i)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    template === i
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subject line</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Your school portal is ready"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1.5">This appears in the inbox before opening. Keep it under 60 characters.</p>
          </div>

          {/* Headline */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email headline</label>
            <input
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Welcome to Tera SM."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Body */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Write your email body here. You can use basic HTML: <strong>, <em>, <br/>"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1.5">Basic HTML supported: <code className="bg-gray-100 px-1 rounded">&lt;strong&gt;</code> <code className="bg-gray-100 px-1 rounded">&lt;em&gt;</code> <code className="bg-gray-100 px-1 rounded">&lt;br/&gt;</code></p>
          </div>

          {/* CTA */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Call to action (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Button text</label>
                <input
                  value={ctaText}
                  onChange={e => setCtaText(e.target.value)}
                  placeholder="Open My Portal"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Button URL</label>
                <input
                  value={ctaUrl}
                  onChange={e => setCtaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── Sidebar: audience + send ── */}
        <div className="space-y-4">

          {/* Audience */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Audience
            </p>
            <div className="space-y-2">
              {AUDIENCES.map(a => (
                <label key={a.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  audience === a.value ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="audience"
                    value={a.value}
                    checked={audience === a.value}
                    onChange={() => setAudience(a.value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {audience === 'BY_PLAN' && (
              <div className="mt-3">
                <select
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          <button
            onClick={() => setPreview(true)}
            disabled={!headline.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            <Eye className="w-4 h-4" /> Preview email
          </button>

          {/* Send */}
          {isSuperAdmin ? (
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !headline.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send Campaign'}
            </button>
          ) : (
            <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold text-center cursor-not-allowed">
              Super admin only
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold text-green-800">Campaign sent!</p>
              </div>
              <p className="text-xs text-green-700">
                <strong>{result.sent}</strong> of <strong>{result.total}</strong> emails delivered successfully.
              </p>
              {result.failed.length > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Failed: {result.failed.join(', ')}
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Preview modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <p className="font-semibold text-gray-900 text-sm">Email Preview</p>
              </div>
              <button onClick={() => setPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">Subject</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{subject || '(no subject)'}</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Banner simulation */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl px-6 py-5 text-center">
                <p className="text-2xl font-black text-white tracking-tight">Tera<span className="text-indigo-400">SM</span></p>
                <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 mt-3 rounded-full" />
              </div>
              {/* Content simulation */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{headline || '(no headline)'}</h2>
                <div
                  className="text-sm text-gray-600 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br/>') }}
                />
                {ctaText && ctaUrl && (
                  <div className="mt-4">
                    <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold rounded-lg">
                      {ctaText} →
                    </span>
                  </div>
                )}
              </div>
              {/* Footer simulation */}
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-1">Tera SM Technologies</p>
                <p className="text-xs text-gray-400">The School Operating System · <span className="text-indigo-500">terasms.com</span></p>
                <p className="text-[10px] text-gray-300 mt-2">Unsubscribe · Manage Preferences</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
