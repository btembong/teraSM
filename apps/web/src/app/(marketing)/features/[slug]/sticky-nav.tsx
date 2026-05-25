'use client'

import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'who-its-for', label: "Who it's for" },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
]

export function StickyNav() {
  const [active, setActive] = useState('capabilities')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) { setActive(e.target.id); break }
        }
      },
      { rootMargin: '-15% 0px -75% 0px' }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm shadow-sm">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                active === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
