'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ChevronLeft } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const ADMIN_TOUR: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Your navigation hub',
    body: 'Everything is organised into modules in the sidebar. Jump between academics, finance, LMS, HR, and more.',
    placement: 'right',
  },
  {
    target: '[data-tour="kpi-grid"]',
    title: 'Live KPI overview',
    body: 'Key metrics update in real time — enrolled students, fees collected, active courses, and staff headcount at a glance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Quick actions',
    body: 'The fastest path to adding students, posting announcements, creating invoices, or scheduling a live class.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="activity-stream"]',
    title: 'Activity stream',
    body: 'Everything happening across your school — enrollments, grade submissions, payments, announcements — in real time.',
    placement: 'left',
  },
  {
    target: '[data-tour="search"]',
    title: 'Command palette',
    body: 'Press Ctrl+K at any time to search pages, take actions, or navigate anywhere. Press ? to see all keyboard shortcuts.',
    placement: 'bottom',
  },
]

function getRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector)
  return el ? el.getBoundingClientRect() : null
}

const PAD = 8

export function AdminOnboardingTour({ storageKey = 'tera_tour_admin' }: { storageKey?: string }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [popPos, setPopPos] = useState({ top: 0, left: 0 })
  const resizeRef = useRef<ResizeObserver | undefined>(undefined)

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (!seen) { setTimeout(() => setActive(true), 1200) }
  }, [storageKey])

  useEffect(() => {
    if (!active) return
    const current = ADMIN_TOUR[step]

    function update() {
      const r = getRect(current.target)
      if (!r) return
      setRect(r)

      const placement = current.placement ?? 'bottom'
      const popW = 320
      const popH = 160
      let top = 0, left = 0

      if (placement === 'bottom') { top = r.bottom + PAD + 12; left = r.left + r.width / 2 - popW / 2 }
      if (placement === 'top')    { top = r.top - popH - PAD - 12; left = r.left + r.width / 2 - popW / 2 }
      if (placement === 'right')  { top = r.top + r.height / 2 - popH / 2; left = r.right + PAD + 12 }
      if (placement === 'left')   { top = r.top + r.height / 2 - popH / 2; left = r.left - popW - PAD - 12 }

      left = Math.max(12, Math.min(left, window.innerWidth - popW - 12))
      top  = Math.max(12, Math.min(top,  window.innerHeight - popH - 12))
      setPopPos({ top, left })
    }

    update()
    resizeRef.current = new ResizeObserver(update)
    const el = document.querySelector(current.target)
    if (el) resizeRef.current.observe(el)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      resizeRef.current?.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, step])

  function dismiss() { localStorage.setItem(storageKey, '1'); setActive(false) }
  function next() { if (step < ADMIN_TOUR.length - 1) setStep(s => s + 1); else dismiss() }
  function prev() { if (step > 0) setStep(s => s - 1) }

  if (!active) return null

  const current = ADMIN_TOUR[step]
  const isLast = step === ADMIN_TOUR.length - 1

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] pointer-events-none">
        {rect && (
          <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={dismiss}>
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx={12} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tour-mask)" />
            <rect x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx={12} fill="none" stroke="rgba(99,102,241,0.7)" strokeWidth={2} />
          </svg>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute pointer-events-auto"
          style={{ top: popPos.top, left: popPos.left, width: 320 }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-start justify-between px-4 pt-4 pb-2">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-1">
                    {ADMIN_TOUR.map((_, i) => (
                      <div key={i} className="h-1 rounded-full transition-all duration-300" style={{ width: i === step ? 16 : 6, background: i <= step ? '#6366f1' : '#e2e8f0' }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">{step + 1} / {ADMIN_TOUR.length}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{current.title}</p>
              </div>
              <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="px-4 pb-4 text-xs text-gray-500 leading-relaxed">{current.body}</p>
            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <button onClick={prev} disabled={step === 0} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-2">
                <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip tour</button>
                <button onClick={next} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                  {isLast ? 'Finish' : 'Next'} {!isLast && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
