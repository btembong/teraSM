'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  Copy, Key, Building2, DollarSign, TrendingUp, Loader2,
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  UNPAID:   'bg-amber-900/40 text-amber-300',
  PAID:     'bg-blue-900/40 text-blue-300',
  VOID:     'bg-gray-700 text-gray-400',
  REFUNDED: 'bg-purple-900/40 text-purple-300',
}

const PLAN_BADGE: Record<string, string> = {
  STARTER:    'bg-gray-700 text-gray-200',
  PRO:        'bg-blue-900 text-blue-200',
  ENTERPRISE: 'bg-blue-800 text-blue-100',
  UNIVERSITY: 'bg-blue-950 text-blue-100',
}

export default function SuperAdminBillingPage() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<{ code: string; invoiceId: string } | null>(null)
  const [copied, setCopied]   = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/super-admin/billing')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const generateCode = async (invoiceId: string) => {
    setGenerating(invoiceId)
    try {
      const res = await fetch(`/api/super-admin/billing/${invoiceId}/generate-code`, { method: 'POST' })
      const d = await res.json()
      if (d.code) {
        setGeneratedCode({ code: d.code, invoiceId })
        load()
      } else {
        alert(d.error ?? 'Failed to generate code')
      }
    } finally {
      setGenerating(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Derive stats from data
  const stats = data?.stats ?? []
  const totalRevenue = stats.find((s: any) => s.status === 'PAID')?._sum?.amount ?? 0
  const pendingCount = (data?.pendingInvoices ?? []).length
  const totalInvoices = stats.reduce((acc: number, s: any) => acc + (s._count?.id ?? 0), 0)
  const paidCount = stats.find((s: any) => s.status === 'PAID')?._count?.id ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Billing</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage school subscriptions and manual payments</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${Number(totalRevenue).toLocaleString()}`} icon={DollarSign} color="bg-indigo-700" />
        <StatCard label="Paid Invoices" value={paidCount} icon={CheckCircle2} color="bg-indigo-600" />
        <StatCard label="Pending Transfers" value={pendingCount} icon={Clock} color="bg-amber-700" />
        <StatCard label="Total Invoices" value={totalInvoices} icon={TrendingUp} color="bg-gray-700" />
      </div>

      {/* Generated code banner */}
      {generatedCode && (
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-200 mb-2">Activation code generated and emailed to the school</p>
              <div className="flex items-center gap-3">
                <code className="font-mono text-xl font-bold text-white tracking-widest bg-gray-900 border border-gray-700 rounded-xl px-4 py-2">
                  {generatedCode.code}
                </code>
                <button onClick={() => copyCode(generatedCode.code)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors">
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending bank transfers */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white">Pending Bank Transfers</h2>
            {pendingCount > 0 && (
              <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : (data?.pendingInvoices ?? []).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No pending bank transfers</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {(data?.pendingInvoices ?? []).map((inv: any) => (
              <div key={inv.id} className="px-6 py-4 flex items-center gap-4">
                {/* School info */}
                <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{inv.tenant?.name ?? inv.tenantId}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PLAN_BADGE[inv.plan] ?? 'bg-gray-700 text-gray-300'} `}>
                      {inv.plan}
                    </span>
                    <span className="text-xs text-gray-500">{inv.billingCycle}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inv.invoiceNo} · {inv.tenant?.email} · {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-white">${Number(inv.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{inv.currency}</p>
                </div>

                {/* Status / action */}
                <div className="flex-shrink-0">
                  {inv.activationCode ? (
                    <div className="text-right">
                      <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded-lg font-mono font-semibold">
                        {inv.activationCode.code}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {inv.activationCode.usedAt
                          ? <span className="text-indigo-400">Used</span>
                          : new Date(inv.activationCode.expiresAt) < new Date()
                            ? <span className="text-red-400">Expired</span>
                            : <span className="text-amber-400">Sent · pending use</span>
                        }
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => generateCode(inv.id)}
                      disabled={generating === inv.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {generating === inv.id
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                        : <><Key className="w-4 h-4" />Generate Code</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activation codes */}
      {(data?.recentCodes ?? []).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Recent Activation Codes</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {(data.recentCodes as any[]).map((ac: any) => (
              <div key={ac.id} className="px-6 py-3 flex items-center gap-4">
                <code className="font-mono text-sm font-bold text-indigo-300 flex-shrink-0 w-52">{ac.code}</code>
                <div className="flex-1 min-w-0 text-xs text-gray-400">
                  <span className={`px-2 py-0.5 rounded-full font-semibold mr-2 ${PLAN_BADGE[ac.plan] ?? 'bg-gray-700 text-gray-300'}`}>{ac.plan}</span>
                  {ac.invoice?.invoiceNo} · ${ac.invoice?.amount?.toLocaleString()}
                </div>
                <div className="flex-shrink-0 text-xs">
                  {ac.usedAt
                    ? <span className="text-indigo-400 font-medium">Used {new Date(ac.usedAt).toLocaleDateString()}</span>
                    : new Date(ac.expiresAt) < new Date()
                      ? <span className="text-red-400 font-medium">Expired</span>
                      : <span className="text-amber-400 font-medium">Pending</span>
                  }
                </div>
                <button onClick={() => copyCode(ac.code)} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
