'use client'

import { useState } from 'react'
import {
  Mail, Phone, MapPin, MessageSquare, CheckCircle2, Loader2, ArrowRight,
  Calendar, Headphones, DollarSign, Zap, Clock, Shield,
} from 'lucide-react'

const INSTITUTION_TYPES = ['Primary School', 'Secondary School', 'College / Polytechnic', 'University', 'Vocational Institute', 'Multi-campus Group', 'Other']
const STUDENT_RANGES   = ['Under 100', '100 – 500', '500 – 1,000', '1,000 – 3,000', '3,000 – 10,000', '10,000+']
const ROLES            = ['Principal / Head', 'Registrar', 'IT / Tech Lead', 'Finance Officer', 'HR Manager', 'Administrator', 'Other']
const ISSUE_TYPES      = ['Billing & Payments', 'Technical Issue', 'Account Access', 'Data / Reports', 'Feature Request', 'Security Concern', 'Other']
const PRIORITIES       = ['Low — general question', 'Medium — affecting some users', 'High — blocking operations', 'Critical — platform down']
const CURRENT_SYSTEMS  = ['Paper / manual', 'Excel & Google Sheets', 'WhatsApp-based', 'Another school management system', 'Custom in-house system', 'Other']
const TIMELINES        = ['ASAP (under 2 weeks)', '1 month', '1–3 months', '3–6 months', 'Just exploring']

type Tab = 'demo' | 'sales' | 'support'

function SuccessCard({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, { title: string; body: string }> = {
    demo:    { title: 'Demo booked!', body: "We'll reach out within 24 hours to confirm a time. Check your inbox for a calendar invite." },
    sales:   { title: 'Sales enquiry received!', body: "Our sales team will review your requirements and get back with a tailored proposal within one business day." },
    support: { title: 'Ticket submitted!', body: "Your support request has been logged. Our team will respond based on your priority level." },
  }
  const m = msgs[tab]
  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-10 text-center">
      <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{m.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{m.body}</p>
    </div>
  )
}

export default function ContactPage() {
  const [tab, setTab] = useState<Tab>('demo')
  const [sent, setSent] = useState(false)

  // Demo form
  const [demo, setDemo] = useState({ name: '', email: '', school: '', role: '', type: '', students: '', phone: '', message: '' })
  // Sales form
  const [sales, setSales] = useState({ name: '', email: '', school: '', students: '', current: '', timeline: '', budget: '', goals: '' })
  // Support form
  const [support, setSupport] = useState({ email: '', issue: '', priority: '', subject: '', description: '' })

  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')

  const field = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await new Promise(r => setTimeout(r, 1400))
      setSent(true)
    } catch {
      setError('Something went wrong. Please email us directly.')
    } finally {
      setSending(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: 'demo',    label: 'Book a Demo',      icon: Calendar    },
    { key: 'sales',   label: 'Talk to Sales',     icon: DollarSign  },
    { key: 'support', label: 'Support Request',   icon: Headphones  },
  ]

  return (
    <div className="bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-12 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Get in touch</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Book a demo, get a quote, or raise a support ticket. We respond fast.</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-5 gap-12">

        {/* Left — forms */}
        <div className="md:col-span-3">

          {/* Tab selector */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            {tabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSent(false); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    tab === t.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              )
            })}
          </div>

          {sent ? (
            <SuccessCard tab={tab} />
          ) : (

            <>
              {/* ── Book a Demo ── */}
              {tab === 'demo' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl px-4 py-3 flex items-start gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Fill in your details and we'll send a calendar invite for a 30-minute live walkthrough tailored to your institution type.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Name *</label>
                      <input required value={demo.name} onChange={e => setDemo(f => ({ ...f, name: e.target.value }))} className={field} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Work Email *</label>
                      <input required type="email" value={demo.email} onChange={e => setDemo(f => ({ ...f, email: e.target.value }))} className={field} placeholder="you@school.edu" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">School / Institution *</label>
                    <input required value={demo.school} onChange={e => setDemo(f => ({ ...f, school: e.target.value }))} className={field} placeholder="University of Example" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Your Role</label>
                      <select value={demo.role} onChange={e => setDemo(f => ({ ...f, role: e.target.value }))} className={field}>
                        <option value="">Select role...</option>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Institution Type</label>
                      <select value={demo.type} onChange={e => setDemo(f => ({ ...f, type: e.target.value }))} className={field}>
                        <option value="">Select type...</option>
                        {INSTITUTION_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Number of Students</label>
                      <select value={demo.students} onChange={e => setDemo(f => ({ ...f, students: e.target.value }))} className={field}>
                        <option value="">Select range...</option>
                        {STUDENT_RANGES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Phone (optional)</label>
                      <input value={demo.phone} onChange={e => setDemo(f => ({ ...f, phone: e.target.value }))} className={field} placeholder="+234 800 000 0000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">What would you like to see?</label>
                    <textarea value={demo.message} onChange={e => setDemo(f => ({ ...f, message: e.target.value }))} rows={3} className={`${field} resize-none`} placeholder="e.g. Finance module, LMS, student portal..." />
                  </div>

                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">{error}</p>}

                  <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl font-semibold text-sm transition-all">
                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : <><span>Book my demo</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="text-center text-xs text-gray-400">We typically confirm within a few hours on business days.</p>
                </form>
              )}

              {/* ── Talk to Sales ── */}
              {tab === 'sales' && (
                <div className="space-y-6">
                  {/* Direct channels — prominent at top */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="https://wa.me/15550000000?text=Hi%2C%20I%27m%20interested%20in%20Tera%20SM%20pricing"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl hover:bg-green-100 dark:hover:bg-green-950/50 transition-all"
                    >
                      <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp Sales</p>
                        <p className="text-xs text-green-700 dark:text-green-400">Instant response</p>
                      </div>
                    </a>
                    <a
                      href="mailto:sales@terasms.com"
                      className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all"
                    >
                      <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">sales@terasms.com</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Reply within 4 hours</p>
                      </div>
                    </a>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <span className="text-xs text-gray-400 font-medium">or fill in your requirements</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Name *</label>
                        <input required value={sales.name} onChange={e => setSales(f => ({ ...f, name: e.target.value }))} className={field} placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Work Email *</label>
                        <input required type="email" value={sales.email} onChange={e => setSales(f => ({ ...f, email: e.target.value }))} className={field} placeholder="you@school.edu" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Institution Name *</label>
                      <input required value={sales.school} onChange={e => setSales(f => ({ ...f, school: e.target.value }))} className={field} placeholder="University of Example" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Number of Students</label>
                        <select value={sales.students} onChange={e => setSales(f => ({ ...f, students: e.target.value }))} className={field}>
                          <option value="">Select range...</option>
                          {STUDENT_RANGES.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Current System</label>
                        <select value={sales.current} onChange={e => setSales(f => ({ ...f, current: e.target.value }))} className={field}>
                          <option value="">What are you using now?</option>
                          {CURRENT_SYSTEMS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Implementation Timeline</label>
                        <select value={sales.timeline} onChange={e => setSales(f => ({ ...f, timeline: e.target.value }))} className={field}>
                          <option value="">When do you need this?</option>
                          {TIMELINES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Monthly Budget (USD)</label>
                        <select value={sales.budget} onChange={e => setSales(f => ({ ...f, budget: e.target.value }))} className={field}>
                          <option value="">Estimated budget...</option>
                          {['Under $500', '$500 – $1,000', '$1,000 – $3,000', '$3,000 – $10,000', '$10,000+', 'Not sure yet'].map(b => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Key requirements or goals</label>
                      <textarea value={sales.goals} onChange={e => setSales(f => ({ ...f, goals: e.target.value }))} rows={3} className={`${field} resize-none`} placeholder="e.g. We need mobile money integration, LMS for 2,000 students, and bilingual French/English support..." />
                    </div>

                    {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">{error}</p>}

                    <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl font-semibold text-sm transition-all">
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><span>Send to sales team</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-center text-xs text-gray-400">Our sales team will respond with a tailored proposal within one business day.</p>
                  </form>
                </div>
              )}

              {/* ── Support Request ── */}
              {tab === 'support' && (
                <div className="space-y-4">
                  {/* Quick channels */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: MessageSquare, label: 'Live Chat', sub: 'Open chat widget', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900', btn: 'text-blue-700 dark:text-blue-400', href: '#' },
                      { icon: Clock, label: 'Status Page', sub: 'Check uptime', color: 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700', btn: 'text-gray-700 dark:text-gray-300', href: '/status' },
                      { icon: Shield, label: 'Security', sub: 'Report a vulnerability', color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900', btn: 'text-orange-700 dark:text-orange-400', href: 'mailto:security@terasms.com' },
                    ].map(c => {
                      const Icon = c.icon
                      return (
                        <a key={c.label} href={c.href} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border ${c.color} hover:opacity-80 transition-opacity text-center`}>
                          <Icon className={`w-5 h-5 ${c.btn}`} />
                          <p className={`text-xs font-semibold ${c.btn}`}>{c.label}</p>
                          <p className="text-[10px] text-gray-400">{c.sub}</p>
                        </a>
                      )
                    })}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Account Email *</label>
                      <input required type="email" value={support.email} onChange={e => setSupport(f => ({ ...f, email: e.target.value }))} className={field} placeholder="you@school.edu" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Issue Type *</label>
                        <select required value={support.issue} onChange={e => setSupport(f => ({ ...f, issue: e.target.value }))} className={field}>
                          <option value="">Select issue type...</option>
                          {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Priority *</label>
                        <select required value={support.priority} onChange={e => setSupport(f => ({ ...f, priority: e.target.value }))} className={field}>
                          <option value="">Select priority...</option>
                          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Subject *</label>
                      <input required value={support.subject} onChange={e => setSupport(f => ({ ...f, subject: e.target.value }))} className={field} placeholder="Brief summary of the issue" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Description *</label>
                      <textarea required value={support.description} onChange={e => setSupport(f => ({ ...f, description: e.target.value }))} rows={5} className={`${field} resize-none`} placeholder="Describe the issue in detail. Include steps to reproduce, error messages, and which module or feature is affected..." />
                    </div>

                    {/* Priority info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Response SLAs</p>
                      {[
                        { label: 'Critical / High', time: 'Within 2–8 hours', color: 'text-red-600 dark:text-red-400' },
                        { label: 'Medium',          time: 'Within 24 hours',  color: 'text-orange-600 dark:text-orange-400' },
                        { label: 'Low',             time: 'Within 48 hours',  color: 'text-gray-500' },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between">
                          <span>{r.label}</span>
                          <span className={`font-medium ${r.color}`}>{r.time}</span>
                        </div>
                      ))}
                    </div>

                    {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">{error}</p>}

                    <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl font-semibold text-sm transition-all">
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><span>Submit ticket</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-center text-xs text-gray-400">For Enterprise & University plans, your dedicated contact is available directly.</p>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Other ways to reach us</h2>
            <div className="space-y-4">
              {[
                { icon: Mail,          label: 'Email',    value: 'hello@terasms.com', link: 'mailto:hello@terasms.com' },
                { icon: MessageSquare, label: 'WhatsApp', value: 'Chat with sales',   link: '#'                        },
                { icon: Phone,         label: 'Phone',    value: '+1 (555) 000-0001', link: 'tel:+15550000001'         },
                { icon: MapPin,        label: 'HQ',       value: 'Lagos, Nigeria',    link: null                       },
              ].map(c => {
                const Icon = c.icon
                const content = (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.value}</p>
                    </div>
                  </div>
                )
                return c.link
                  ? <a key={c.label} href={c.link} className="block hover:opacity-75 transition-opacity">{content}</a>
                  : <div key={c.label}>{content}</div>
              })}
            </div>
          </div>

          {/* Response times */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-5 border border-blue-100 dark:border-blue-900">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Support response times</h3>
            <div className="space-y-2">
              {[
                { tier: 'Starter',    time: '48 hours',   color: 'text-gray-500' },
                { tier: 'Pro',        time: '24 hours',   color: 'text-blue-600 dark:text-blue-400' },
                { tier: 'Enterprise', time: '8 hours',    color: 'text-purple-600 dark:text-purple-400' },
                { tier: 'University', time: '24/7 phone', color: 'text-amber-600 dark:text-amber-400' },
              ].map(r => (
                <div key={r.tier} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{r.tier}</span>
                  <span className={`font-semibold ${r.color}`}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zap highlight */}
          <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-sm">Enterprise & University</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Get a dedicated account manager, a private Slack channel, and 24/7 phone support — all included.
            </p>
            <a href="mailto:sales@terasms.com" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Contact for custom pricing <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="space-y-2">
            {[
              '14-day free trial — no credit card',
              'Data never sold to third parties',
              'GDPR & FERPA compliant',
              'Cancel anytime, data export included',
            ].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
