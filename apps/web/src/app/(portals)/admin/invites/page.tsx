'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, Link2, Mail, Copy, Check, Trash2,
  Clock, Users, RefreshCw, ChevronDown, Send,
} from 'lucide-react'

type InviteRole = 'STUDENT' | 'TEACHER' | 'STAFF' | 'PARENT' | 'REGISTRAR' | 'FINANCE_ADMIN' | 'HR_ADMIN' | 'TENANT_ADMIN'

const ROLE_OPTIONS: { value: InviteRole; label: string; color: string }[] = [
  { value: 'STUDENT',      label: 'Student',          color: 'bg-blue-100 text-blue-700' },
  { value: 'TEACHER',      label: 'Teacher',           color: 'bg-blue-100 text-blue-700' },
  { value: 'STAFF',        label: 'Staff',             color: 'bg-blue-50 text-blue-600' },
  { value: 'PARENT',       label: 'Parent',            color: 'bg-gray-100 text-gray-700' },
  { value: 'REGISTRAR',    label: 'Registrar',         color: 'bg-blue-100 text-blue-800' },
  { value: 'FINANCE_ADMIN',label: 'Finance Admin',     color: 'bg-gray-100 text-gray-600' },
  { value: 'HR_ADMIN',     label: 'HR Admin',          color: 'bg-gray-50 text-gray-600' },
  { value: 'TENANT_ADMIN', label: 'School Admin',      color: 'bg-blue-900 text-white' },
]

interface Invite {
  id: string
  email: string | null
  role: InviteRole
  token: string
  maxUses: number
  useCount: number
  expiresAt: string | null
  createdAt: string
}

function roleLabel(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label ?? role
}
function roleColor(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.color ?? 'bg-gray-100 text-gray-700'
}
function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`
}

export default function InvitesPage() {
  const [tab, setTab] = useState<'email' | 'link'>('email')
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  // Email tab state
  const [emailText, setEmailText]   = useState('')
  const [emailRole, setEmailRole]   = useState<InviteRole>('STUDENT')
  const [emailExpiry, setEmailExpiry] = useState('7')
  const [sending, setSending]       = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Link tab state
  const [linkRole, setLinkRole]     = useState<InviteRole>('STUDENT')
  const [linkExpiry, setLinkExpiry] = useState('30')
  const [linkMaxUses, setLinkMaxUses] = useState('50')
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId]     = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/invites')
    const data = await res.json()
    setInvites(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchInvites() }, [fetchInvites])

  async function sendEmailInvites() {
    const emails = emailText.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
    if (!emails.length) return
    setSending(true)
    setSendResult(null)
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails, role: emailRole, expiresInDays: Number(emailExpiry) }),
    })
    const data = await res.json()
    if (res.ok) {
      setSendResult({ ok: true, msg: `${data.invites.length} invite${data.invites.length > 1 ? 's' : ''} created successfully` })
      setEmailText('')
      fetchInvites()
    } else {
      setSendResult({ ok: false, msg: data.error ?? 'Something went wrong' })
    }
    setSending(false)
  }

  async function generateLink() {
    setGenerating(true)
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: linkRole,
        expiresInDays: Number(linkExpiry),
        maxUses: Number(linkMaxUses),
      }),
    })
    if (res.ok) fetchInvites()
    setGenerating(false)
  }

  async function revokeInvite(id: string) {
    await fetch(`/api/invites/${id}`, { method: 'DELETE' })
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  function copyLink(token: string, id: string) {
    navigator.clipboard.writeText(inviteUrl(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const emailInvites = invites.filter(i => i.email !== null)
  const linkInvites  = invites.filter(i => i.email === null)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Invitations</h2>
        <p className="text-sm text-gray-400">Send email invites or generate shareable links for new users</p>
      </div>

      {/* Create invite card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { key: 'email', icon: Mail,  label: 'Invite by email' },
            { key: 'link',  icon: Link2, label: 'Shareable link'  },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email addresses <span className="font-normal text-gray-400">(one per line, or comma-separated)</span>
                </label>
                <textarea
                  value={emailText}
                  onChange={e => setEmailText(e.target.value)}
                  rows={4}
                  placeholder="john@school.edu&#10;jane@school.edu&#10;..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                  <div className="relative">
                    <select
                      value={emailRole}
                      onChange={e => setEmailRole(e.target.value as InviteRole)}
                      className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
                    >
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expires in</label>
                  <div className="relative">
                    <select
                      value={emailExpiry}
                      onChange={e => setEmailExpiry(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
                    >
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {sendResult && (
                <p className={`text-sm px-4 py-2.5 rounded-xl border ${sendResult.ok ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-900 border-gray-200 font-medium'}`}>
                  {sendResult.msg}
                </p>
              )}

              <button
                onClick={sendEmailInvites}
                disabled={sending || !emailText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Creating invites…' : 'Create invites'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Generate a link anyone can use to join your school with the selected role. Share it via WhatsApp, email, or post it on your website.</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                  <div className="relative">
                    <select
                      value={linkRole}
                      onChange={e => setLinkRole(e.target.value as InviteRole)}
                      className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
                    >
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expires in</label>
                  <div className="relative">
                    <select
                      value={linkExpiry}
                      onChange={e => setLinkExpiry(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max uses</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={linkMaxUses}
                    onChange={e => setLinkMaxUses(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={generateLink}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {generating ? 'Generating…' : 'Generate link'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending invites */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Active invites</h2>
          <button onClick={fetchInvites} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
        ) : invites.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
            <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No invites yet. Create one above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email invites */}
            {emailInvites.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">By email ({emailInvites.length})</p>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {emailInvites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor(inv.role)}`}>{roleLabel(inv.role)}</span>
                            {inv.expiresAt && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Expires {new Date(inv.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyLink(inv.token, inv.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-indigo-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === inv.id ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shareable links */}
            {linkInvites.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Shareable links ({linkInvites.length})</p>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {linkInvites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-gray-600 truncate text-xs">
                            {typeof window !== 'undefined' ? inviteUrl(inv.token) : `/invite/${inv.token}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor(inv.role)}`}>{roleLabel(inv.role)}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {inv.useCount}/{inv.maxUses} uses
                            </span>
                            {inv.expiresAt && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Expires {new Date(inv.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyLink(inv.token, inv.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-indigo-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === inv.id ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
