'use client'

import { useEffect, useState } from 'react'
import {
  Settings, Palette, Key, Webhook, Copy, Eye, EyeOff, Plus, Trash2,
  Upload, X, CreditCard, Shield, Bell, CheckCircle2, AlertTriangle,
  Lock, ShieldCheck, ToggleLeft, ToggleRight, Mail, MessageSquare,
  Smartphone, ChevronRight, RefreshCw,
} from 'lucide-react'

type Tab = 'school' | 'branding' | 'billing' | 'security' | 'notifications' | 'api' | 'webhooks'

const WEBHOOK_EVENTS = [
  'enrollment.created', 'enrollment.dropped',
  'payment.completed', 'invoice.created',
  'grade.published', 'attendance.marked',
  'user.created', 'announcement.published',
]

const PLAN_COLORS: Record<string, string> = {
  STARTER:    'bg-gray-100 text-gray-700',
  PRO:        'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-blue-100 text-blue-800',
  UNIVERSITY: 'bg-blue-900 text-white',
}

const PLAN_NEXT: Record<string, string> = {
  STARTER:    'PRO',
  PRO:        'ENTERPRISE',
  ENTERPRISE: 'UNIVERSITY',
  UNIVERSITY: '',
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('school')

  // School + branding
  const [tenant,      setTenant]      = useState<any>(null)
  const [settings,    setSettings]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [savedMsg,    setSavedMsg]    = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Billing
  const [billing,       setBilling]       = useState<any>(null)
  const [billingLoaded, setBillingLoaded] = useState(false)

  // Security
  const [secSettings,  setSecSettings]  = useState<any>({})
  const [auditLogs,    setAuditLogs]    = useState<any[]>([])
  const [secLoaded,    setSecLoaded]    = useState(false)
  const [savingSec,    setSavingSec]    = useState(false)

  // Notifications
  const [notifSettings, setNotifSettings] = useState<any>({
    emailNotifications:  true,
    smsNotifications:    false,
    pushNotifications:   true,
    whatsappNotifications: false,
    feeReminders:        true,
    attendanceAlerts:    true,
    resultAlerts:        true,
    announcementAlerts:  true,
    leaveAlerts:         true,
    enrollmentAlerts:    true,
  })
  const [notifLoaded,  setNotifLoaded]  = useState(false)
  const [savingNotif,  setSavingNotif]  = useState(false)

  // API keys + webhooks
  const [apiKeys,          setApiKeys]          = useState<any[]>([])
  const [webhooks,         setWebhooks]         = useState<any[]>([])
  const [newKeyName,       setNewKeyName]       = useState('')
  const [newKeyScopes,     setNewKeyScopes]     = useState<string[]>(['read'])
  const [newKeyRaw,        setNewKeyRaw]        = useState<string | null>(null)
  const [showKey,          setShowKey]          = useState(false)
  const [newWebhookUrl,    setNewWebhookUrl]    = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])
  const [creatingKey,      setCreatingKey]      = useState(false)
  const [creatingWebhook,  setCreatingWebhook]  = useState(false)

  /* ── Loaders ── */
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/admin/api-keys').then(r => r.json()),
      fetch('/api/admin/webhooks').then(r => r.json()),
    ]).then(([s, keys, hooks]) => {
      setTenant(s.tenant)
      setSettings(s.settings || {})
      if (s.tenant?.logoUrl) setLogoPreview(s.tenant.logoUrl)
      setApiKeys(keys)
      setWebhooks(hooks)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (tab === 'billing' && !billingLoaded) {
      fetch('/api/admin/billing').then(r => r.json()).then(d => { setBilling(d); setBillingLoaded(true) })
    }
    if (tab === 'security' && !secLoaded) {
      fetch('/api/admin/security').then(r => r.json()).then(d => {
        setSecSettings(d.settings || {})
        setAuditLogs(d.auditLogs || [])
        setSecLoaded(true)
      })
    }
    if (tab === 'notifications' && !notifLoaded) {
      fetch('/api/admin/notifications-settings').then(r => r.json()).then(d => {
        if (d.settings) setNotifSettings((prev: any) => ({ ...prev, ...d.settings }))
        setNotifLoaded(true)
      })
    }
  }, [tab])

  /* ── Save helpers ── */
  const showSaved = () => { setSavedMsg('Saved!'); setTimeout(() => setSavedMsg(''), 2500) }

  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadErr, setLogoUploadErr] = useState('')

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setLogoUploadErr('')
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload to R2
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'logos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setLogoPreview(data.url)
    } catch (err: any) {
      setLogoUploadErr(err.message ?? 'Upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant: { name: tenant.name, phone: tenant.phone, timezone: tenant.timezone, logoUrl: logoPreview },
        settings,
      }),
    })
    setSaving(false)
    showSaved()
  }

  const saveSecurity = async () => {
    setSavingSec(true)
    await fetch('/api/admin/security', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secSettings),
    })
    setSavingSec(false)
    showSaved()
  }

  const saveNotifications = async () => {
    setSavingNotif(true)
    await fetch('/api/admin/notifications-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifSettings),
    })
    setSavingNotif(false)
    showSaved()
  }

  const createApiKey = async () => {
    setCreatingKey(true)
    const res  = await fetch('/api/admin/api-keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes }),
    })
    const data = await res.json()
    setNewKeyRaw(data.rawKey)
    setApiKeys(prev => [data, ...prev])
    setNewKeyName('')
    setCreatingKey(false)
  }

  const revokeKey = async (id: string) => {
    await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' })
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false } : k))
  }

  const createWebhook = async () => {
    setCreatingWebhook(true)
    const res  = await fetch('/api/admin/webhooks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }),
    })
    const data = await res.json()
    setWebhooks(prev => [{ ...data, _count: { deliveries: 0 } }, ...prev])
    setNewWebhookUrl('')
    setNewWebhookEvents([])
    setCreatingWebhook(false)
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'school',        label: 'School Profile',  icon: Settings    },
    { key: 'branding',      label: 'Branding',        icon: Palette     },
    { key: 'billing',       label: 'Billing & Plan',  icon: CreditCard  },
    { key: 'security',      label: 'Security',        icon: Shield      },
    { key: 'notifications', label: 'Notifications',   icon: Bell        },
    { key: 'api',           label: 'API Keys',        icon: Key         },
    { key: 'webhooks',      label: 'Webhooks',        icon: Webhook     },
  ]

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading settings...</div>

  /* ── Shared field style ── */
  const field = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const fieldDisabled = 'w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400'
  const saveBtn = (label: string, loading: boolean, onClick: () => void) => (
    <div className="flex items-center gap-3 pt-2">
      <button onClick={onClick} disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
        {loading ? 'Saving...' : label}
      </button>
      {savedMsg && <span className="flex items-center gap-1.5 text-sm text-blue-600 font-medium"><CheckCircle2 className="w-4 h-4" />{savedMsg}</span>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your school profile, branding, security and integrations</p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ══ SCHOOL PROFILE ══ */}
      {tab === 'school' && tenant && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">School Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'School Name',  key: 'name',     editable: true  },
              { label: 'Subdomain',    key: 'slug',     editable: false },
              { label: 'Email',        key: 'email',    editable: false },
              { label: 'Phone',        key: 'phone',    editable: true  },
              { label: 'Country',      key: 'country',  editable: false },
              { label: 'Timezone',     key: 'timezone', editable: true  },
            ].map(({ label, key, editable }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  value={tenant[key] ?? ''}
                  disabled={!editable}
                  onChange={e => editable && setTenant((t: any) => ({ ...t, [key]: e.target.value }))}
                  className={editable ? field : fieldDisabled}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            {[
              { label: 'Plan',         value: tenant.plan,                      color: PLAN_COLORS[tenant.plan] ?? 'bg-gray-100 text-gray-700' },
              { label: 'Status',       value: tenant.status,                    color: tenant.status === 'ACTIVE' || tenant.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-900 text-white' },
              { label: 'Student Cap',  value: `${tenant.studentCap} students`,  color: 'bg-blue-50 text-blue-700' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
          {saveBtn('Save Changes', saving, save)}
        </div>
      )}

      {/* ══ BRANDING ══ */}
      {tab === 'branding' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Brand Settings</h2>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">School Logo</label>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain p-1" />
                  : <Upload className="w-6 h-6 text-gray-300" />}
              </div>
              <div className="space-y-2">
                <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${logoUploading ? 'opacity-60 pointer-events-none bg-gray-50 text-gray-400 border-gray-200' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'}`}>
                  {logoUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {logoUploading ? 'Uploading…' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                  <input type="file" accept="image/*" className="hidden" disabled={logoUploading} onChange={handleLogoUpload} />
                </label>
                {logoPreview && !logoUploading && (
                  <button onClick={() => setLogoPreview(null)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                    <X className="w-3.5 h-3.5" /> Remove logo
                  </button>
                )}
                {logoUploadErr && <p className="text-xs text-gray-900 font-medium">{logoUploadErr}</p>}
                <p className="text-xs text-gray-400">PNG, JPG or SVG · Max 5MB · Recommended 256×256px</p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'primaryColor',   label: 'Primary Color'   },
              { key: 'secondaryColor', label: 'Secondary Color' },
              { key: 'accentColor',    label: 'Accent Color'    },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings?.[key] ?? '#2563eb'} onChange={e => setSettings((s: any) => ({ ...s, [key]: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={settings?.[key] ?? '#2563eb'} onChange={e => setSettings((s: any) => ({ ...s, [key]: e.target.value }))} className={`${field} font-mono`} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
            <textarea value={settings?.welcomeMessage ?? ''} onChange={e => setSettings((s: any) => ({ ...s, welcomeMessage: e.target.value }))} rows={2} className={`${field} resize-none`} placeholder="Shown on student login..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
            <input value={settings?.footerText ?? ''} onChange={e => setSettings((s: any) => ({ ...s, footerText: e.target.value }))} className={field} placeholder="© 2025 Your School Name" />
          </div>
          {saveBtn('Save Branding', saving, save)}
        </div>
      )}

      {/* ══ BILLING & PLAN ══ */}
      {tab === 'billing' && (
        <div className="space-y-4">
          {!billingLoaded ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading billing info...</div>
          ) : billing ? (
            <>
              {/* Plan card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Current Plan</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-gray-900">{billing.tenant?.plan}</h2>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[billing.tenant?.plan] ?? 'bg-gray-100 text-gray-700'}`}>{billing.tenant?.status}</span>
                    </div>
                  </div>
                  {PLAN_NEXT[billing.tenant?.plan] && (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
                      Upgrade to {PLAN_NEXT[billing.tenant?.plan]} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Trial banner */}
                {billing.tenant?.trialEndsAt && (
                  <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
                    <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Your free trial ends on <strong>{new Date(billing.tenant.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Upgrade to keep access.
                    </p>
                  </div>
                )}

                {/* Usage bars */}
                <div className="space-y-4">
                  {/* Students */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">Students</span>
                      <span className="text-gray-500">{billing.studentCount} / {billing.tenant?.studentCap}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${billing.studentCount / billing.tenant?.studentCap > 0.9 ? 'bg-gray-900' : billing.studentCount / billing.tenant?.studentCap > 0.7 ? 'bg-blue-400' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, (billing.studentCount / billing.tenant?.studentCap) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Math.round((billing.studentCount / billing.tenant?.studentCap) * 100)}% of limit used</p>
                  </div>

                  {/* Storage */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">Storage</span>
                      <span className="text-gray-500">~1 GB / {billing.tenant?.storageCap} GB</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (1 / billing.tenant?.storageCap) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan features */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">What&apos;s included</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Student & staff management',
                    'Academic modules',
                    'Fee collection & invoicing',
                    'Attendance tracking',
                    'Results & transcripts',
                    'Email notifications',
                    billing.tenant?.plan !== 'STARTER' && 'Full LMS',
                    billing.tenant?.plan !== 'STARTER' && 'Live classes',
                    billing.tenant?.plan !== 'STARTER' && 'HR & payroll',
                    billing.tenant?.plan !== 'STARTER' && 'Parent portal',
                    (billing.tenant?.plan === 'ENTERPRISE' || billing.tenant?.plan === 'UNIVERSITY') && 'AI features',
                    billing.tenant?.plan === 'UNIVERSITY' && 'Thesis portal',
                  ].filter(Boolean).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent invoices */}
              {billing.invoices?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Billing History</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {billing.invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Invoice #{inv.id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'PAID' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                          <span className="text-sm font-semibold text-gray-900">${Number(inv.totalAmount).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ══ SECURITY ══ */}
      {tab === 'security' && (
        <div className="space-y-4">
          {!secLoaded ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading security settings...</div>
          ) : (
            <>
              {/* Security settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Access & Authentication</h2>
                </div>

                {[
                  { key: 'enforce2FA',          label: 'Enforce 2FA for all staff',         desc: 'Staff and admin must enable two-factor authentication to access the platform.' },
                  { key: 'restrictAdminByIP',   label: 'IP whitelist for Admin Portal',     desc: 'Only allow admin logins from specific IP addresses. (Enterprise+)' },
                  { key: 'singleSessionOnly',   label: 'Single session per user',           desc: 'Automatically log out other sessions when a user signs in on a new device.' },
                  { key: 'strongPasswordPolicy',label: 'Enforce strong password policy',    desc: 'Minimum 10 characters, must include uppercase, number and symbol.' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle enabled={!!secSettings[key]} onChange={v => setSecSettings((s: any) => ({ ...s, [key]: v }))} />
                  </div>
                ))}

                {/* Session timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout</label>
                  <select
                    value={secSettings.sessionTimeoutMinutes ?? 60}
                    onChange={e => setSecSettings((s: any) => ({ ...s, sessionTimeoutMinutes: Number(e.target.value) }))}
                    className={field}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={240}>4 hours</option>
                    <option value={480}>8 hours</option>
                    <option value={1440}>24 hours</option>
                  </select>
                </div>

                {saveBtn('Save Security Settings', savingSec, saveSecurity)}
              </div>

              {/* Audit log */}
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Audit Log</h3>
                  </div>
                  <button onClick={() => fetch('/api/admin/security').then(r => r.json()).then(d => setAuditLogs(d.auditLogs || []))} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No audit events yet</div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-400">{log.entity} · {log.userId?.slice(0, 8)}...</p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ NOTIFICATIONS ══ */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          {!notifLoaded ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading notification settings...</div>
          ) : (
            <>
              {/* Channels */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Notification Channels</h2>
                <p className="text-sm text-gray-500">Choose which channels are active for your school. Per-user preferences can be set individually.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'emailNotifications',    label: 'Email',     icon: Mail,          desc: 'Resend / SMTP'        },
                    { key: 'smsNotifications',       label: 'SMS',      icon: Smartphone,    desc: "Africa's Talking / Twilio" },
                    { key: 'pushNotifications',      label: 'Push',     icon: Bell,          desc: 'Browser & mobile app' },
                    { key: 'whatsappNotifications',  label: 'WhatsApp', icon: MessageSquare, desc: 'WhatsApp Business API' },
                  ].map(({ key, label, icon: Icon, desc }) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${notifSettings[key] ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${notifSettings[key] ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`w-4 h-4 ${notifSettings[key] ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </div>
                      <Toggle enabled={notifSettings[key]} onChange={v => setNotifSettings((s: any) => ({ ...s, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Event types */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Notification Events</h2>
                <p className="text-sm text-gray-500">Control which events trigger notifications school-wide.</p>
                <div className="space-y-3">
                  {[
                    { key: 'feeReminders',       label: 'Fee reminders',             desc: '7-day, 3-day and 1-day alerts before payment due date' },
                    { key: 'attendanceAlerts',   label: 'Attendance alerts',         desc: 'Notify parents when student misses a class' },
                    { key: 'resultAlerts',       label: 'Result publication alerts', desc: 'Notify students when results are released' },
                    { key: 'announcementAlerts', label: 'Announcement alerts',       desc: 'Notify users when new announcements are posted' },
                    { key: 'leaveAlerts',        label: 'Leave request alerts',      desc: 'Notify admins of pending leave requests' },
                    { key: 'enrollmentAlerts',   label: 'Enrollment alerts',         desc: 'Notify when students register or drop courses' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <Toggle enabled={notifSettings[key]} onChange={v => setNotifSettings((s: any) => ({ ...s, [key]: v }))} />
                    </div>
                  ))}
                </div>
                {saveBtn('Save Notification Settings', savingNotif, saveNotifications)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ API KEYS ══ */}
      {tab === 'api' && (
        <div className="space-y-4">
          {newKeyRaw && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">API Key created — copy it now. It won&apos;t be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 font-mono text-gray-800">
                  {showKey ? newKeyRaw : '•'.repeat(40)}
                </code>
                <button onClick={() => setShowKey(v => !v)} className="p-2 text-gray-500 hover:text-gray-700">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                <button onClick={() => navigator.clipboard.writeText(newKeyRaw)} className="p-2 text-gray-500 hover:text-gray-700"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Create API Key</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className={field} placeholder="e.g. Mobile App, Integration" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
                <select value={newKeyScopes[0]} onChange={e => setNewKeyScopes(e.target.value === 'read-write' ? ['read', 'write'] : ['read'])} className={field}>
                  <option value="read">Read only</option>
                  <option value="read-write">Read + Write</option>
                </select>
              </div>
              <button onClick={createApiKey} disabled={!newKeyName || creatingKey} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No API keys yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{key.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{key.keyPrefix}... · {(key.scopes as string[]).join(', ')}</p>
                      <p className="text-xs text-gray-400">{key.lastUsedAt ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Never used'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${key.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{key.isActive ? 'Active' : 'Revoked'}</span>
                      {key.isActive && <button onClick={() => revokeKey(key.id)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ WEBHOOKS ══ */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Add Webhook</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} className={field} placeholder="https://your-app.com/webhooks/tera" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events to listen to</label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map(evt => (
                    <label key={evt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes(evt)}
                        onChange={e => setNewWebhookEvents(prev => e.target.checked ? [...prev, evt] : prev.filter(v => v !== evt))}
                        className="rounded"
                      />
                      <code className="text-xs text-gray-600">{evt}</code>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={createWebhook} disabled={!newWebhookUrl || newWebhookEvents.length === 0 || creatingWebhook} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
                {creatingWebhook ? 'Adding...' : 'Add Webhook'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200">
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No webhooks configured</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {webhooks.map(wh => (
                  <div key={wh.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm font-mono truncate max-w-sm">{wh.url}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{(wh.events as string[]).length} events · {wh._count.deliveries} deliveries</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wh.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{wh.isActive ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
