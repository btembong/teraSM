import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ArrowRight, Check, X, Minus } from 'lucide-react'
import { ModuleGrid } from './module-grid'

function CellValue({ val, note, highlight }: { val: string; note?: string; highlight?: boolean }) {
  if (val.startsWith('text:')) {
    return (
      <div>
        <span className={`text-xs font-semibold ${highlight ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
          {val.slice(5)}
        </span>
        {note && <p className="text-[10px] text-gray-400 mt-0.5">{note}</p>}
      </div>
    )
  }
  if (val === 'yes') return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${highlight ? 'bg-blue-600' : 'bg-emerald-100 dark:bg-emerald-950/50'}`}>
        <Check className={`w-3.5 h-3.5 ${highlight ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
      </div>
      {note && <span className="text-[10px] text-gray-400 leading-tight max-w-[100px]">{note}</span>}
    </div>
  )
  if (val === 'no') return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
        <X className="w-3.5 h-3.5 text-red-400" />
      </div>
      {note && <span className="text-[10px] text-gray-400 leading-tight max-w-[100px]">{note}</span>}
    </div>
  )
  // partial
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
        <Minus className="w-3.5 h-3.5 text-amber-500" />
      </div>
      {note && <span className="text-[10px] text-gray-400 leading-tight max-w-[100px]">{note}</span>}
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Features — Tera SM',
  description: 'Explore all 19 modules: academics, finance, LMS, live classes, HR, AI, analytics, parent portal, student life, and more. One platform for every school need.',
  keywords: [
    'school management features', 'LMS features Africa', 'student information system features',
    'school ERP modules', 'academic management features', 'school finance software features',
  ],
  openGraph: {
    title: 'Features — Tera SM',
    description: '19 integrated modules covering every aspect of school operations. Built for African institutions.',
    url: 'https://terasms.com/features',
  },
  alternates: { canonical: 'https://terasms.com/features' },
}


const HIGHLIGHTS = [
  { value: '19', label: 'Modules' },
  { value: '4', label: 'Portals' },
  { value: '3', label: 'Payment gateways' },
  { value: '99.9%', label: 'Uptime SLA' },
]

type CompRow = { feature: string; tera: string; teraNote?: string; whatsapp: string; whatsappNote?: string; moodle: string; moodleNote?: string; western: string; westernNote?: string }
const compRows: CompRow[] = [
  { feature: 'Student portal (web + mobile)',      tera: 'yes',           teraNote: 'PWA + iOS/Android',           whatsapp: 'no',  moodle: 'partial', western: 'yes' },
  { feature: 'Online fee collection',              tera: 'yes',           teraNote: 'Paystack, Flutterwave, MoMo', whatsapp: 'no',  moodle: 'no',      western: 'partial', westernNote: 'Cards only, no MoMo' },
  { feature: 'Mobile money (MTN, Orange)',         tera: 'yes',           teraNote: 'Native support',              whatsapp: 'no',  moodle: 'no',      western: 'no' },
  { feature: 'LMS (content, assignments, grades)', tera: 'yes',           whatsapp: 'no',  moodle: 'yes',         moodleNote: 'Requires IT to host',    western: 'partial' },
  { feature: 'Built-in live classes (WebRTC)',     tera: 'yes',           teraNote: 'No Zoom licence needed',      whatsapp: 'no',  moodle: 'no',      moodleNote: 'Needs Zoom/BBB add-on',  western: 'no' },
  { feature: 'HR & payroll',                       tera: 'yes',           whatsapp: 'no',  moodle: 'no',          western: 'no' },
  { feature: 'AI academic advisor',                tera: 'yes',           whatsapp: 'no',  moodle: 'no',          western: 'no' },
  { feature: 'Parent portal',                      tera: 'yes',           whatsapp: 'no',  moodle: 'no',          western: 'partial' },
  { feature: 'QR transcript authentication',       tera: 'yes',           whatsapp: 'no',  moodle: 'no',          western: 'no' },
  { feature: 'French / bilingual support',         tera: 'yes',           whatsapp: 'yes', moodle: 'yes',         western: 'no',     westernNote: 'English-only' },
  { feature: 'Custom domain + branding',           tera: 'yes',           teraNote: 'Under 30 min setup',         whatsapp: 'no',  moodle: 'partial', western: 'partial' },
  { feature: 'Data hosted in Africa',              tera: 'yes',           teraNote: 'Region selection',            whatsapp: 'no',  moodle: 'partial', moodleNote: 'If self-hosted', western: 'no' },
  { feature: 'Audit trail & GDPR tools',           tera: 'yes',           whatsapp: 'no',  moodle: 'partial',     western: 'yes' },
  { feature: 'Setup time',                         tera: 'text:< 1 week', whatsapp: 'text:Immediate',             moodle: 'text:Weeks–months', western: 'text:Months' },
  { feature: 'Monthly cost (500 students)',         tera: 'text:From $99', whatsapp: 'text:~$0 (hidden costs)',    moodle: 'text:$200–500 (hosting + IT)', western: 'text:$500–2,000+' },
]

export default function FeaturesPage() {
  return (
    <div className="bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-14 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Zap className="w-3.5 h-3.5" /> Everything your institution needs
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
          One platform.<br />Every module.
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
          Tera SM replaces every disconnected tool your school uses — from admissions to alumni, academics to finance, live classes to career placement.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
            Start Free Trial
          </Link>
          <Link href="/contact" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors">
            Book a Demo
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-4 gap-6">
          {HIGHLIGHTS.map(h => (
            <div key={h.label} className="text-center">
              <p className="text-3xl font-black text-gray-900 dark:text-white">{h.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{h.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Module grid — stagger animated */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <ModuleGrid />
      </section>

      {/* Competitor comparison */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            How we compare
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Tera SM vs the alternatives</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
            Most African institutions piece together a solution from WhatsApp, Zoom, Moodle, and Excel.
            Here's how that compares to running everything on Tera SM.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-semibold w-56 bg-gray-50 dark:bg-gray-900">Feature</th>
                <th className="px-6 py-4 bg-blue-600 text-white font-bold text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>Tera SM</span>
                    <span className="text-[10px] font-normal text-blue-200 bg-blue-500/50 px-2 py-0.5 rounded-full">All-in-one</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-gray-600 dark:text-gray-300 font-semibold bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-1">
                    <span>WhatsApp + Excel</span>
                    <span className="text-[10px] font-normal text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">Current reality</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-gray-600 dark:text-gray-300 font-semibold bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-1">
                    <span>Moodle + Zoom</span>
                    <span className="text-[10px] font-normal text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">DIY open-source</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-gray-600 dark:text-gray-300 font-semibold bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-1">
                    <span>Western SIS</span>
                    <span className="text-[10px] font-normal text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">e.g. PowerSchool</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {compRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50/50 dark:bg-gray-900/30'}>
                  <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300 font-medium text-sm">{row.feature}</td>
                  <td className="px-6 py-3.5 text-center bg-blue-50/40 dark:bg-blue-950/10">
                    <CellValue val={row.tera} note={row.teraNote} highlight />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <CellValue val={row.whatsapp} note={row.whatsappNote} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <CellValue val={row.moodle} note={row.moodleNote} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <CellValue val={row.western} note={row.westernNote} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feature request CTA */}
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Don&apos;t see what you need?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">We add features every sprint. Tell us what your school needs.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex-shrink-0"
          >
            Request a feature <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-blue-600 py-16 text-center px-6">
        <h2 className="text-3xl font-black text-white mb-3">See it in action</h2>
        <p className="text-blue-100 mb-8 text-sm">Book a live demo and we will walk through any module you need.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-2xl font-semibold text-sm transition-colors">
            Start Free Trial
          </Link>
          <Link href="/contact" className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2">
            Book a Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  )
}
