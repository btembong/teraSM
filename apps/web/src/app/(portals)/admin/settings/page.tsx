'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings, Palette, Key, Webhook, Copy, Eye, EyeOff, Plus, Trash2,
  Upload, X, CreditCard, Shield, Bell, CheckCircle2, AlertTriangle,
  Lock, ShieldCheck, ToggleLeft, ToggleRight, Mail, MessageSquare,
  Smartphone, ChevronRight, RefreshCw, Download, Loader2, Globe, ExternalLink,
  Video, Users, UserCog,
} from 'lucide-react'

type Tab = 'school' | 'branding' | 'billing' | 'security' | 'notifications' | 'api' | 'webhooks' | 'gdpr' | 'domain' | 'roles' | 'onboarding'

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
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('school')

  // Roles tab navigates to its own page
  const handleTabClick = (key: Tab) => {
    if (key === 'roles') { router.push('/admin/settings/roles'); return }
    setTab(key)
  }

  // School + branding
  const [tenant,      setTenant]      = useState<any>(null)
  const [settings,    setSettings]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [savedMsg,    setSavedMsg]    = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Billing
  const [billing,          setBilling]          = useState<any>(null)
  const [billingLoaded,    setBillingLoaded]    = useState(false)
  const [billingCycle,     setBillingCycle]     = useState<'MONTHLY'|'ANNUAL'>('ANNUAL')
  const [selectedPlan,     setSelectedPlan]     = useState<string|null>(null)
  const [showPayModal,     setShowPayModal]     = useState(false)
  const [showActivateModal,setShowActivateModal] = useState(false)
  const [showBankModal,    setShowBankModal]    = useState(false)
  const [activationCode,   setActivationCode]   = useState('')
  const [activating,       setActivating]       = useState(false)
  const [activateMsg,      setActivateMsg]      = useState<{type:'ok'|'err';text:string}|null>(null)
  const [bankTransferResult,setBankTransferResult] = useState<any>(null)
  const [checkingOut,      setCheckingOut]      = useState(false)

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

  // Onboarding videos
  const [studentVideoUrl,  setStudentVideoUrl]  = useState('')
  const [staffVideoUrl,    setStaffVideoUrl]    = useState('')
  const [savingVideos,     setSavingVideos]     = useState(false)

  // Domain
  const [customDomain,     setCustomDomain]     = useState('')
  const [savingDomain,     setSavingDomain]     = useState(false)
  const [domainMsg,        setDomainMsg]        = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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
      if (s.tenant?.customDomain) setCustomDomain(s.tenant.customDomain)
      if (s.tenant?.studentOnboardingVideoUrl) setStudentVideoUrl(s.tenant.studentOnboardingVideoUrl)
      if (s.tenant?.staffOnboardingVideoUrl) setStaffVideoUrl(s.tenant.staffOnboardingVideoUrl)
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
        tenant: {
          name: tenant.name, phone: tenant.phone, timezone: tenant.timezone,
          currency: tenant.currency, logoUrl: logoPreview,
          address: tenant.address, city: tenant.city, state: tenant.state,
          postalCode: tenant.postalCode, website: tenant.website,
        },
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

  const saveOnboardingVideos = async () => {
    setSavingVideos(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant: {
          studentOnboardingVideoUrl: studentVideoUrl || null,
          staffOnboardingVideoUrl: staffVideoUrl || null,
        },
      }),
    })
    setSavingVideos(false)
    showSaved()
  }

  const saveDomain = async () => {
    const domain = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '')
    setSavingDomain(true)
    setDomainMsg(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant: { customDomain: domain || null } }),
      })
      if (!res.ok) throw new Error('Save failed')
      setCustomDomain(domain)
      setDomainMsg({ type: 'ok', text: domain ? 'Custom domain saved! Add the CNAME record below to activate it.' : 'Custom domain removed.' })
    } catch {
      setDomainMsg({ type: 'err', text: 'Failed to save domain.' })
    } finally {
      setSavingDomain(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'school',        label: 'School Profile',  icon: Settings    },
    { key: 'branding',      label: 'Branding',        icon: Palette     },
    { key: 'billing',       label: 'Billing & Plan',  icon: CreditCard  },
    { key: 'security',      label: 'Security',        icon: Shield      },
    { key: 'notifications', label: 'Notifications',   icon: Bell        },
    { key: 'api',           label: 'API Keys',        icon: Key         },
    { key: 'webhooks',      label: 'Webhooks',        icon: Webhook     },
    { key: 'gdpr',          label: 'Privacy & GDPR',  icon: ShieldCheck },
    { key: 'domain',        label: 'Domain',          icon: Globe       },
    { key: 'roles',         label: 'Roles & Permissions', icon: Shield  },
    { key: 'onboarding',   label: 'Onboarding',          icon: Video   },
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
      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabClick(key)}
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
              { label: 'School Name',  key: 'name',       editable: true  },
              { label: 'Subdomain',    key: 'slug',       editable: false },
              { label: 'Email',        key: 'email',      editable: false },
              { label: 'Phone',        key: 'phone',      editable: true  },
              { label: 'Country',      key: 'country',    editable: false },
              { label: 'Website',      key: 'website',    editable: true  },
              { label: 'Timezone',     key: 'timezone',   editable: true  },
              { label: 'Currency',     key: 'currency',   editable: true  },
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

          {/* Address section */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">School Address</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Street / Building Address</label>
                <input
                  value={tenant.address ?? ''}
                  onChange={e => setTenant((t: any) => ({ ...t, address: e.target.value }))}
                  className={field}
                  placeholder="e.g. 123 University Avenue"
                />
              </div>
              {[
                { label: 'City',        key: 'city',       placeholder: 'e.g. Accra'          },
                { label: 'State / Region', key: 'state',   placeholder: 'e.g. Greater Accra'  },
                { label: 'Postal Code', key: 'postalCode', placeholder: 'e.g. GA-123'         },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    value={tenant[key] ?? ''}
                    onChange={e => setTenant((t: any) => ({ ...t, [key]: e.target.value }))}
                    className={field}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
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
      {tab === 'billing' && (() => {
        const PLANS = ['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY'] as const
        const PRICES: Record<string, {monthly:number;annual:number}> = {
          STARTER:    {monthly:49,   annual:499},
          PRO:        {monthly:149,  annual:1499},
          ENTERPRISE: {monthly:499,  annual:4999},
          UNIVERSITY: {monthly:0,    annual:0},
        }
        const PLAN_DESC: Record<string, string> = {
          STARTER:    'Up to 500 students · 5 admin seats · Core modules',
          PRO:        'Up to 3,000 students · LMS · Live classes · HR',
          ENTERPRISE: 'Up to 10,000 · AI · Analytics · Custom domain',
          UNIVERSITY: 'Unlimited · Dedicated infra · Custom SLA',
        }
        const currentPlan = billing?.tenant?.plan ?? 'STARTER'

        const handleUpgrade = (plan: string) => {
          setSelectedPlan(plan)
          setShowPayModal(true)
        }

        const startCheckout = async (gateway: 'paystack' | 'stripe') => {
          setCheckingOut(true)
          try {
            const res = await fetch('/api/billing/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan: selectedPlan, cycle: billingCycle, gateway }),
            })
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else alert(data.error ?? 'Checkout failed')
          } finally {
            setCheckingOut(false)
          }
        }

        const startBankTransfer = async () => {
          setCheckingOut(true)
          try {
            const res = await fetch('/api/billing/bank-transfer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan: selectedPlan, cycle: billingCycle }),
            })
            const data = await res.json()
            if (res.ok) { setBankTransferResult(data); setShowPayModal(false); setShowBankModal(true) }
            else alert(data.error ?? 'Failed')
          } finally {
            setCheckingOut(false)
          }
        }

        const handleActivate = async () => {
          if (!activationCode.trim()) return
          setActivating(true); setActivateMsg(null)
          try {
            const res = await fetch('/api/billing/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: activationCode.trim().toUpperCase() }),
            })
            const data = await res.json()
            if (res.ok) {
              setActivateMsg({ type: 'ok', text: `Activated! Your ${data.plan} plan is now live.` })
              setActivationCode('')
              // Refresh billing
              fetch('/api/admin/billing').then(r => r.json()).then(d => setBilling(d))
            } else {
              setActivateMsg({ type: 'err', text: data.error ?? 'Activation failed.' })
            }
          } finally {
            setActivating(false)
          }
        }

        return (
          <div className="space-y-5">
            {!billingLoaded ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading billing info...</div>
            ) : (
              <>
                {/* Current plan + usage */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Current Plan</p>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-gray-900">{currentPlan}</h2>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[currentPlan] ?? 'bg-gray-100 text-gray-700'}`}>
                          {billing?.subscription?.status ?? billing?.tenant?.status}
                        </span>
                      </div>
                      {billing?.subscription?.currentPeriodEnd && (
                        <p className="text-xs text-gray-400 mt-1">
                          Renews {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowActivateModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" /> Enter Code
                    </button>
                  </div>

                  {/* Trial banner */}
                  {billing?.tenant?.trialEndsAt && (
                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        Free trial ends <strong>{new Date(billing.tenant.trialEndsAt).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</strong>. Upgrade to keep access.
                      </p>
                    </div>
                  )}

                  {/* Usage bars */}
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { label: 'Students', used: billing?.studentCount ?? 0, cap: billing?.tenant?.studentCap ?? 500 },
                      { label: 'Storage (GB)', used: 1, cap: billing?.tenant?.storageCap ?? 10 },
                    ].map(({ label, used, cap }) => {
                      const pct = Math.min(100, (used / cap) * 100)
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium text-gray-700">{label}</span>
                            <span className="text-gray-500">{used} / {cap}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{width:`${pct}%`}} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{Math.round(pct)}% used</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Plan selector */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-gray-900">Choose a Plan</h3>
                    {/* Monthly / Annual toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 text-sm">
                      {(['MONTHLY','ANNUAL'] as const).map(c => (
                        <button key={c} onClick={() => setBillingCycle(c)}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${billingCycle === c ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                          {c === 'MONTHLY' ? 'Monthly' : 'Annual'}{c === 'ANNUAL' && <span className="ml-1 text-xs text-blue-600 font-semibold">−15%</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {PLANS.map(plan => {
                      const price = PRICES[plan]
                      const isCurrent = plan === currentPlan
                      const amt = billingCycle === 'MONTHLY' ? price.monthly : price.annual
                      return (
                        <div key={plan} className={`border rounded-xl p-4 transition-all ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-gray-900">{plan}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{PLAN_DESC[plan]}</p>
                            </div>
                            {isCurrent && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Current</span>}
                          </div>
                          <p className="text-xl font-black text-gray-900 mt-3">
                            {plan === 'UNIVERSITY' ? 'Custom' : `$${amt.toLocaleString()}`}
                            {plan !== 'UNIVERSITY' && <span className="text-sm font-normal text-gray-400">/{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>}
                          </p>
                          {!isCurrent && (
                            <button
                              onClick={() => plan === 'UNIVERSITY' ? window.open('mailto:sales@terasms.com','_blank') : handleUpgrade(plan)}
                              className="mt-3 w-full py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                              {plan === 'UNIVERSITY' ? 'Contact Sales' : currentPlan === 'UNIVERSITY' ? 'Downgrade' : 'Upgrade'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Billing history */}
                {billing?.saasInvoices?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Billing History</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {billing.saasInvoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{inv.invoiceNo}</p>
                            <p className="text-xs text-gray-400">{inv.plan} · {inv.billingCycle} · {new Date(inv.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'PAID' ? 'bg-blue-100 text-blue-700' : inv.status === 'UNPAID' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                              {inv.status}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">${Number(inv.amount).toLocaleString()}</span>
                            {inv.receiptUrl && (
                              <a href={inv.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Payment Method Modal ── */}
            {showPayModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Upgrade to {selectedPlan}</h2>
                    <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{selectedPlan} Plan · {billingCycle === 'MONTHLY' ? 'Monthly' : 'Annual'}</span>
                      <span className="font-bold text-gray-900">${(PRICES[selectedPlan!]?.[billingCycle === 'MONTHLY' ? 'monthly' : 'annual'] ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Choose payment method</p>
                  <div className="space-y-3">
                    <button onClick={() => startCheckout('paystack')} disabled={checkingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all text-sm font-medium text-gray-800 disabled:opacity-50">
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      <div className="text-left">
                        <p className="font-semibold">Pay with Paystack</p>
                        <p className="text-xs text-gray-400">Card, bank transfer, USSD, mobile money</p>
                      </div>
                    </button>
                    <button onClick={() => startCheckout('stripe')} disabled={checkingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all text-sm font-medium text-gray-800 disabled:opacity-50">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <p className="font-semibold">Pay with Stripe</p>
                        <p className="text-xs text-gray-400">International cards (Visa, Mastercard, Amex)</p>
                      </div>
                    </button>
                    <button onClick={startBankTransfer} disabled={checkingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all text-sm font-medium text-gray-800 disabled:opacity-50">
                      <Download className="w-5 h-5 text-gray-500" />
                      <div className="text-left">
                        <p className="font-semibold">Bank Transfer</p>
                        <p className="text-xs text-gray-400">Get invoice + bank details by email. 1-2 business days.</p>
                      </div>
                    </button>
                  </div>
                  {checkingOut && <p className="text-center text-sm text-gray-400 mt-4">Redirecting to payment…</p>}
                </div>
              </div>
            )}

            {/* ── Bank Transfer Confirmation Modal ── */}
            {showBankModal && bankTransferResult && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Bank Transfer Details Sent</h2>
                    <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Invoice created</p>
                      <p className="text-sm text-blue-700 mt-1">We&apos;ve emailed you the bank details and invoice. Complete the transfer using:</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
                    <div className="flex justify-between"><span className="text-gray-500">Invoice No.</span><span className="font-bold">{bankTransferResult.invoiceNo}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">${bankTransferResult.amount?.toLocaleString()} USD</span></div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Once your payment is confirmed, you&apos;ll receive an <strong>activation code</strong> by email. Enter it below to activate your subscription instantly.</p>
                  <button onClick={() => { setShowBankModal(false); setShowActivateModal(true) }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                    I have my activation code
                  </button>
                </div>
              </div>
            )}

            {/* ── Activation Code Modal ── */}
            {showActivateModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Enter Activation Code</h2>
                    <button onClick={() => { setShowActivateModal(false); setActivateMsg(null) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Enter the activation code from your confirmation email.</p>
                  <input
                    type="text"
                    value={activationCode}
                    onChange={e => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="TERA-PRO-ANN-XXXXXXXX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-semibold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  {activateMsg && (
                    <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 mb-3 text-sm ${activateMsg.type === 'ok' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                      {activateMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      {activateMsg.text}
                    </div>
                  )}
                  <button onClick={handleActivate} disabled={activating || !activationCode.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    {activating ? <><RefreshCw className="w-4 h-4 animate-spin" />Activating…</> : 'Activate Subscription'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

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

      {/* ══ ONBOARDING VIDEOS ══ */}
      {tab === 'onboarding' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900">Onboarding Videos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Set the welcome video your students and staff see on their very first login. Paste a direct video URL (.mp4) or a Cloudflare Stream URL. Leave blank to show a placeholder.
            </p>
          </div>

          {/* Student video */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Student Portal Video</p>
                <p className="text-xs text-gray-400">Shown to students on their first login</p>
              </div>
            </div>
            <input
              value={studentVideoUrl}
              onChange={e => setStudentVideoUrl(e.target.value)}
              className={field}
              placeholder="https://your-cdn.com/student-welcome.mp4"
            />
            {studentVideoUrl && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Preview</p>
                <video
                  src={studentVideoUrl}
                  controls
                  className="w-full max-w-sm rounded-xl bg-slate-900"
                  style={{ maxHeight: 200 }}
                />
              </div>
            )}
          </div>

          {/* Staff video */}
          <div className="space-y-3 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCog className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Staff Portal Video</p>
                <p className="text-xs text-gray-400">Shown to teachers and staff on their first login</p>
              </div>
            </div>
            <input
              value={staffVideoUrl}
              onChange={e => setStaffVideoUrl(e.target.value)}
              className={field}
              placeholder="https://your-cdn.com/staff-welcome.mp4"
            />
            {staffVideoUrl && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Preview</p>
                <video
                  src={staffVideoUrl}
                  controls
                  className="w-full max-w-sm rounded-xl bg-slate-900"
                  style={{ maxHeight: 200 }}
                />
              </div>
            )}
          </div>

          {/* Admin video notice */}
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Admin Portal Video</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  The admin portal intro video is a Tera SM platform tour — the same for all schools. It is managed by Tera and cannot be customised here.
                </p>
              </div>
            </div>
          </div>

          {saveBtn('Save Video Settings', savingVideos, saveOnboardingVideos)}
        </div>
      )}

      {/* ══ PRIVACY & GDPR ══ */}
      {tab === 'gdpr' && <GdprTab />}

      {/* ══ DOMAIN ══ */}
      {tab === 'domain' && tenant && (
        <div className="space-y-6">
          {/* Subdomain info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Your Tera SM Subdomain</h2>
            <p className="text-sm text-gray-500 mb-4">Your school is accessible at this address by default.</p>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <code className="text-blue-700 font-mono text-sm flex-1">{tenant.slug}.terasms.com</code>
              <a href={`https://${tenant.slug}.terasms.com`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Custom domain */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-semibold text-gray-900">Custom Domain</h2>
              <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">Pro & above</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Use your own domain (e.g. <span className="font-mono text-gray-700">portal.myschool.edu</span>) instead of the Tera SM subdomain.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custom Domain</label>
                <input
                  className={field}
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                  placeholder="portal.myschool.edu"
                />
              </div>
              {domainMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  domainMsg.type === 'ok'
                    ? 'bg-blue-50 border border-blue-100 text-blue-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {domainMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  {domainMsg.text}
                </div>
              )}
              <button
                onClick={saveDomain}
                disabled={savingDomain}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {savingDomain && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Domain
              </button>
            </div>
          </div>

          {/* DNS Instructions */}
          {customDomain && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-1">DNS Configuration</h2>
              <p className="text-sm text-gray-500 mb-4">
                Add the following CNAME record in your DNS provider (e.g. Cloudflare, GoDaddy, Namecheap) to point your domain to Tera SM.
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Type', 'Host / Name', 'Value / Target', 'TTL'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">CNAME</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{customDomain.split('.').slice(0, -2).join('.') || '@'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-700">proxy.terasms.com</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">Auto</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> DNS propagation can take up to 48 hours.</p>
                <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> SSL certificate is automatically provisioned once the CNAME is detected.</p>
                <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> Contact <strong>support@terasms.com</strong> after adding the record to trigger verification.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── GDPR Tab (separate component to keep state isolated) ──────────────────────
function GdprTab() {
  const [search, setSearch]           = useState('')
  const [students, setStudents]       = useState<any[]>([])
  const [searching, setSearching]     = useState(false)
  const [selectedId, setSelectedId]   = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [exporting, setExporting]     = useState(false)
  const [erasing, setErasing]         = useState(false)
  const [eraseConfirm, setEraseConfirm] = useState('')
  const [msg, setMsg]                 = useState('')

  async function searchStudents(q: string) {
    if (!q.trim()) { setStudents([]); return }
    setSearching(true)
    const res = await fetch(`/api/admin/users?role=STUDENT&search=${encodeURIComponent(q)}&page=1`)
    const data = await res.json()
    setStudents(data.users ?? [])
    setSearching(false)
  }

  function selectStudent(s: any) {
    setSelectedId(s.id)
    setSelectedName(`${s.firstName} ${s.lastName}`)
    setSearch(`${s.firstName} ${s.lastName} — ${s.email}`)
    setStudents([])
    setEraseConfirm('')
    setMsg('')
  }

  function exportData() {
    if (!selectedId) return
    setExporting(true)
    window.location.href = `/api/admin/gdpr/export?studentId=${selectedId}`
    setTimeout(() => setExporting(false), 2000)
  }

  async function eraseData() {
    if (eraseConfirm !== 'ERASE') { setMsg('Type ERASE to confirm'); return }
    if (!confirm(`Permanently anonymise all PII for ${selectedName}? This cannot be undone.`)) return
    setErasing(true)
    const res = await fetch(`/api/admin/gdpr/erase?studentId=${selectedId}`, { method: 'DELETE' })
    const data = await res.json()
    setMsg(res.ok ? `${data.message}` : (data.error ?? 'Erase failed'))
    setErasing(false)
    if (res.ok) { setSelectedId(''); setSelectedName(''); setSearch(''); setEraseConfirm('') }
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">GDPR Data Compliance Tools</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Use these tools to fulfil data subject access requests (DSAR) and right-to-erasure requests under GDPR, NDPR, or FERPA. All actions are logged in the audit trail.
          </p>
        </div>
      </div>

      {/* Student lookup */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Student Data Lookup</h2>
        <div className="relative">
          <input
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search student by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedId(''); searchStudents(e.target.value) }}
          />
          {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gray-400" />}
          {students.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {students.map(s => (
                <button key={s.id} onClick={() => selectStudent(s)}
                  className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left gap-3">
                  <span className="font-semibold text-gray-900">{s.firstName} {s.lastName}</span>
                  <span className="text-gray-400 truncate">{s.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedId && (
        <>
          {/* Data Export */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Data Access Request (DSAR)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Export a complete JSON file of all data held for <span className="font-semibold text-gray-800">{selectedName}</span> — enrollments, grades, payments, messages, and more.
            </p>
            <button
              onClick={exportData}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</> : <><Download className="w-4 h-4" /> Export All Data</>}
            </button>
          </div>

          {/* Right to Erasure */}
          <div className="bg-white rounded-2xl border border-red-200 p-6">
            <h2 className="font-semibold text-red-700 mb-1">Right to Erasure</h2>
            <p className="text-sm text-gray-500 mb-4">
              Anonymise all personal identifiable information (PII) for <span className="font-semibold text-gray-800">{selectedName}</span>. Academic records are retained under an anonymised ID. This action is irreversible.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Type <span className="font-mono text-red-600">ERASE</span> to confirm
                </label>
                <input
                  className="w-full px-3 py-2.5 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                  placeholder="ERASE"
                  value={eraseConfirm}
                  onChange={e => setEraseConfirm(e.target.value.toUpperCase())}
                />
              </div>
              <button
                onClick={eraseData}
                disabled={erasing || eraseConfirm !== 'ERASE'}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {erasing ? <><Loader2 className="w-4 h-4 animate-spin" /> Erasing…</> : <><Trash2 className="w-4 h-4" /> Erase Personal Data</>}
              </button>
            </div>
            {msg && (
              <p className={`mt-3 text-sm font-medium ${msg.includes('anonymised') ? 'text-green-700' : 'text-red-700'}`}>{msg}</p>
            )}
          </div>
        </>
      )}

      {/* Retention policy info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Data Retention Policy</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Student academic records', period: '7 years after graduation' },
            { label: 'Financial records & invoices', period: '7 years (legal requirement)' },
            { label: 'Audit logs', period: '2 years' },
            { label: 'Chat messages', period: '1 year' },
            { label: 'Attendance records', period: '5 years' },
            { label: 'System notifications', period: '6 months' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-700">{row.label}</span>
              <span className="text-gray-500 text-xs font-medium">{row.period}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Custom retention policies are available on the University tier. Contact support to configure.
        </p>
      </div>
    </div>
  )
}

