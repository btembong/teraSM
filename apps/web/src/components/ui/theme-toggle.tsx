'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className={compact ? 'w-8 h-8' : 'w-24 h-8'} />
  }

  if (compact) {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
    const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
    return (
      <button
        onClick={() => setTheme(next)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={`Theme: ${theme}`}
      >
        <Icon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {(['light', 'system', 'dark'] as const).map((t) => {
        const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              theme === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{t}</span>
          </button>
        )
      })}
    </div>
  )
}
