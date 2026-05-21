'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface SimpleTab {
  label: string
  href: string
  badge?: number
}

function getActiveHref(tabs: SimpleTab[], pathname: string): string {
  for (let i = tabs.length - 1; i >= 1; i--) {
    if (pathname === tabs[i].href || pathname.startsWith(tabs[i].href + '/')) {
      return tabs[i].href
    }
  }
  return tabs[0]?.href ?? ''
}

export function ModuleTabs({ tabs }: { tabs: SimpleTab[] }) {
  const pathname = usePathname()
  const activeHref = getActiveHref(tabs, pathname)

  return (
    <div className="flex items-center gap-0.5 border-b border-gray-100">
      {tabs.map(tab => {
        const active = tab.href === activeHref
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              active
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold rounded-full ${
                active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
