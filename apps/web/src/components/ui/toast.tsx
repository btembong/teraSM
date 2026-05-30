'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

type ToastInput = Omit<ToastItem, 'id'>

interface ToastContextValue {
  toast: (input: ToastInput) => string
  dismiss: (id: string) => void
}

/* ─── Context ────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null)

/* ─── Icons & styles per type ────────────────────────────── */
const TYPE_CONFIG: Record<ToastType, { icon: React.ElementType; iconClass: string; bar: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-500', bar: 'bg-emerald-500' },
  error:   { icon: XCircle,      iconClass: 'text-red-500',     bar: 'bg-red-500'     },
  info:    { icon: Info,         iconClass: 'text-blue-500',    bar: 'bg-blue-500'    },
  warning: { icon: AlertTriangle, iconClass: 'text-amber-500',  bar: 'bg-amber-500'   },
}

/* ─── Single toast card ──────────────────────────────────── */
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const cfg  = TYPE_CONFIG[item.type]
  const Icon = cfg.icon
  const duration = item.duration ?? 4000

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="relative w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* Progress bar */}
      <motion.div
        className={`absolute top-0 left-0 h-0.5 ${cfg.bar}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        onAnimationComplete={() => onDismiss(item.id)}
      />

      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 ${cfg.iconClass}`} strokeWidth={2} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
          )}
          {item.action && (
            <button
              onClick={() => { item.action!.onClick(); onDismiss(item.id) }}
              className="mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {item.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onDismiss(item.id)}
          className="flex-shrink-0 p-0.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Provider ───────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput): string => {
    const id = `toast-${++counter.current}`
    setToasts(prev => [{ ...input, id }, ...prev].slice(0, 5))
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast stack — top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(item => (
            <div key={item.id} className="pointer-events-auto">
              <ToastCard item={item} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/* ─── Hook ───────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')

  return {
    toast:   ctx.toast,
    dismiss: ctx.dismiss,
    success: (title: string, opts?: Partial<ToastInput>) => ctx.toast({ type: 'success', title, ...opts }),
    error:   (title: string, opts?: Partial<ToastInput>) => ctx.toast({ type: 'error',   title, ...opts }),
    info:    (title: string, opts?: Partial<ToastInput>) => ctx.toast({ type: 'info',    title, ...opts }),
    warning: (title: string, opts?: Partial<ToastInput>) => ctx.toast({ type: 'warning', title, ...opts }),
  }
}
