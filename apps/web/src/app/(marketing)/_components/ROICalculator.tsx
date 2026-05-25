'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, DollarSign, Clock, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n).toLocaleString()}`
}

function getPlan(students: number): { name: string; cost: number } {
  if (students <= 500)   return { name: 'Starter',    cost: 89  * 12 }
  if (students <= 3000)  return { name: 'Pro',         cost: 229 * 12 }
  if (students <= 10000) return { name: 'Enterprise',  cost: 599 * 12 }
  return                        { name: 'University',  cost: 1199 * 12 }
}

export default function ROICalculator() {
  const [students,   setStudents]   = useState(600)
  const [collection, setCollection] = useState(62)
  const [admins,     setAdmins]     = useState(4)

  const r = useMemo(() => {
    const plan            = getPlan(students)
    const feeGap          = Math.max(0, 0.94 - collection / 100)
    const feesRecovered   = students * 400 * feeGap          // $400 avg annual fee
    const hoursSaved      = admins * 160 * 0.40              // 40% of 160 hrs/month
    const timeSavedValue  = hoursSaved * 12 * 8              // $8/hr conservative
    const netBenefit      = feesRecovered + timeSavedValue - plan.cost
    const roi             = plan.cost > 0 ? (netBenefit / plan.cost) * 100 : 0
    return { feesRecovered, hoursSaved, timeSavedValue, plan, netBenefit, roi }
  }, [students, collection, admins])

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-6">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            ROI calculator
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How much could Tera SM save your school?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Enter your numbers. See your estimated annual savings in recovered fees and admin time freed up.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Sliders */}
          <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 space-y-9">

            {/* Student count */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-gray-900 dark:text-white text-sm">Number of students</label>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">{students.toLocaleString()}</span>
              </div>
              <input
                type="range" min={100} max={10000} step={50}
                value={students}
                onChange={e => setStudents(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 bg-blue-100 dark:bg-blue-950/40"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>100</span><span>5,000</span><span>10,000</span>
              </div>
            </div>

            {/* Fee collection rate */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-gray-900 dark:text-white text-sm">Current fee collection rate</label>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">{collection}%</span>
              </div>
              <input
                type="range" min={10} max={93} step={1}
                value={collection}
                onChange={e => setCollection(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 bg-blue-100 dark:bg-blue-950/40"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>10%</span><span>50%</span><span>93%</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                Tera SM schools average 94% collection rate
              </p>
            </div>

            {/* Admin team size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-gray-900 dark:text-white text-sm">Admin team size</label>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">
                  {admins} {admins === 1 ? 'person' : 'people'}
                </span>
              </div>
              <input
                type="range" min={1} max={20} step={1}
                value={admins}
                onChange={e => setAdmins(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 bg-blue-100 dark:bg-blue-950/40"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>1</span><span>10</span><span>20</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-5">
              Based on avg. $400 annual fee per student, 40% admin time reduction, and $8/hr average admin cost.
              Actual results vary by institution.
            </p>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-2 space-y-4">

            {/* Hero metric */}
            <div className="bg-blue-600 rounded-3xl p-7 text-white">
              <p className="text-blue-200 text-sm font-medium mb-1">Net annual benefit</p>
              <p className="text-4xl font-bold tabular-nums">
                {fmt(Math.max(0, r.netBenefit))}
              </p>
              <p className="text-blue-200 text-sm mt-1">after platform cost</p>
              <div className="mt-5 pt-4 border-t border-white/20 flex items-end justify-between">
                <div>
                  <p className="text-blue-200 text-xs">Return on investment</p>
                  <p className="text-3xl font-bold tabular-nums">
                    {Math.max(0, Math.round(r.roi)).toLocaleString()}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs">Recommended plan</p>
                  <p className="text-white font-bold">{r.plan.name}</p>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {[
                { icon: DollarSign, label: 'Extra fees collected / year', value: fmt(r.feesRecovered) },
                { icon: Clock,      label: 'Admin hours saved / month',   value: `${Math.round(r.hoursSaved)} hrs` },
                { icon: Zap,        label: `${r.plan.name} plan cost / year`, value: fmt(r.plan.cost) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
