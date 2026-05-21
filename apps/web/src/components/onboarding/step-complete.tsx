'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@tera-sm/utils'

const FEATURES = [
  'Student portal ready',
  'Admin dashboard active',
  'Finance module enabled',
  'Notifications configured',
]

interface Props {
  onFinish: () => void
}

export function StepComplete({ onFinish }: Props) {
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    FEATURES.forEach((_, i) => {
      setTimeout(() => setVisible((prev) => [...prev, i]), i * 300 + 400)
    })
  }, [])

  return (
    <div className="rounded-2xl border bg-white p-10 shadow-sm text-center space-y-8">
      {/* Animated checkmark */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-bounce-once">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Your school is ready!</h2>
        <p className="text-gray-400">
          Everything is set up. Welcome to Tera SM — let&apos;s get to work.
        </p>
      </div>

      {/* Feature checklist animation */}
      <div className="mx-auto max-w-xs space-y-3 text-left">
        {FEATURES.map((f, i) => (
          <div
            key={f}
            className={cn(
              'flex items-center gap-3 transition-all duration-500',
              visible.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            )}
          >
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium">{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="mx-auto flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-md"
      >
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
