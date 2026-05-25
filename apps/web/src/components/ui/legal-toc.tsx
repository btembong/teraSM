'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: string
  title: string
}

export function LegalToc({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) { setActive(e.target.id); break }
        }
      },
      { rootMargin: '-8% 0px -78% 0px' }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  return (
    <div className="sticky top-24">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        Contents
      </p>
      <nav className="space-y-0.5">
        {sections.map(s => {
          const isActive = active === s.id
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`relative block text-sm py-1 pl-3.5 pr-2 rounded-r transition-colors duration-200 leading-snug ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {/* Animated left border indicator */}
              <span
                className="absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-full bg-blue-500 transition-all duration-300"
                style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'scaleY(1)' : 'scaleY(0)' }}
              />
              {s.title}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
