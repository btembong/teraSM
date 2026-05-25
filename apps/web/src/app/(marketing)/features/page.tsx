import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'
import { ModuleGrid } from './module-grid'

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
