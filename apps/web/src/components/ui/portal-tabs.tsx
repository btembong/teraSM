'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  label: string
  href: string
}

interface PortalTabsProps {
  tabs: Tab[]
}

export function PortalTabs({ tabs }: PortalTabsProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    // Exact match for the first tab (overview), prefix match for the rest
    const idx = tabs.findIndex(t => t.href === href)
    if (idx === 0) {
      // Active only if no other tab matches
      return !tabs.slice(1).some(t => pathname === t.href || pathname.startsWith(t.href + '/'))
        && (pathname === href || pathname.startsWith(href + '/'))
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="flex items-center gap-1 border-b border-gray-100 -mt-2 mb-6">
      {tabs.map(tab => {
        const active = isActive(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
