'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock } from 'lucide-react'

const SERVICES = [
  { name: 'Web App',               group: 'Core' },
  { name: 'API Server',            group: 'Core' },
  { name: 'Authentication',        group: 'Core' },
  { name: 'Database',              group: 'Core' },
  { name: 'File Storage',          group: 'Infrastructure' },
  { name: 'CDN',                   group: 'Infrastructure' },
  { name: 'Background Jobs',       group: 'Infrastructure' },
  { name: 'Email Delivery',        group: 'Notifications' },
  { name: 'SMS Notifications',     group: 'Notifications' },
  { name: 'Push Notifications',    group: 'Notifications' },
  { name: 'Live Classes (LiveKit)',group: 'Modules' },
  { name: 'Payment Gateway',       group: 'Modules' },
  { name: 'AI Features',           group: 'Modules' },
]

type Status = 'operational' | 'degraded' | 'outage'

const STATUS_CONFIG: Record<Status, { label: string; icon: typeof CheckCircle2; color: string; dot: string }> = {
  operational: { label: 'Operational',    icon: CheckCircle2,   color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  degraded:    { label: 'Degraded',       icon: AlertTriangle,  color: 'text-amber-600 bg-amber-50 border-amber-200',       dot: 'bg-amber-500'  },
  outage:      { label: 'Outage',         icon: XCircle,        color: 'text-red-600 bg-red-50 border-red-200',             dot: 'bg-red-500'    },
}

const HISTORY = [
  { date: '11 May 2026',  title: 'All systems operational',           status: 'operational', desc: 'No incidents.' },
  { date: '8 May 2026',   title: 'API latency — resolved',            status: 'degraded',    desc: 'Elevated API response times between 14:00–15:30 UTC. Root cause: database connection pool exhaustion. Resolved by scaling pool size.' },
  { date: '2 May 2026',   title: 'Email delivery delay — resolved',   status: 'degraded',    desc: 'Email notifications delayed by up to 20 minutes due to Resend provider issue. Resolved automatically.' },
  { date: '18 Apr 2026',  title: 'All systems operational',           status: 'operational', desc: 'No incidents.' },
]

export default function StatusPage() {
  const [statuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(SERVICES.map(s => [s.name, 'operational' as Status]))
  )
  const [lastChecked, setLastChecked] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setLastChecked(new Date().toLocaleTimeString())
  }, [])

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setLastChecked(new Date().toLocaleTimeString())
      setRefreshing(false)
    }, 800)
  }

  const allOperational = Object.values(statuses).every(s => s === 'operational')
  const groups = [...new Set(SERVICES.map(s => s.group))]

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-10">
        {allOperational ? (
          <div className="inline-flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-bold text-sm">All systems operational</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-amber-700 font-bold text-sm">Some systems degraded</span>
          </div>
        )}
        <h1 className="text-3xl font-black text-gray-900 mb-2">Tera SM Status</h1>
        <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Last checked: {lastChecked}</span>
          <button onClick={refresh} className={`flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors ${refreshing ? 'opacity-50' : ''}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </section>

      {/* Service list */}
      <section className="max-w-3xl mx-auto px-6 pb-12 space-y-6">
        {groups.map(group => (
          <div key={group} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{group}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {SERVICES.filter(s => s.group === group).map(s => {
                const st = statuses[s.name]
                const cfg = STATUS_CONFIG[st]
                const Icon = cfg.icon
                return (
                  <div key={s.name} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Uptime */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">30-day uptime</p>
          <div className="flex items-end gap-1 mb-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i === 7 || i === 23 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ height: i === 7 || i === 23 ? 24 : 32 }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>30 days ago</span>
            <span className="font-semibold text-emerald-600">99.93% uptime</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* Incident history */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Incident history</h2>
        <div className="space-y-3">
          {HISTORY.map((h, i) => {
            const cfg = STATUS_CONFIG[h.status as Status]
            const Icon = cfg.icon
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{h.date}</p>
                {h.desc !== 'No incidents.' && (
                  <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
