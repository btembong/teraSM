'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

export interface ModuleTab {
  label: string
  href: string
  Icon?: React.ComponentType<{ className?: string }>
  badge?: number
}

interface ModuleHeaderProps {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  tabs: ModuleTab[]
  description?: string
}

function getActiveHref(tabs: ModuleTab[], pathname: string): string {
  // Check specific (non-first) tabs first — most specific match wins
  for (let i = tabs.length - 1; i >= 1; i--) {
    if (pathname === tabs[i].href || pathname.startsWith(tabs[i].href + '/')) {
      return tabs[i].href
    }
  }
  return tabs[0]?.href ?? ''
}

export function ModuleHeader({ label, Icon, tabs, description }: ModuleHeaderProps) {
  const pathname = usePathname()
  const activeHref = getActiveHref(tabs, pathname)

  return (
    <div className="mb-8 -mt-1">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium">{label}</span>
      </div>

      {/* Module identity row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">{label}</h1>
          {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-gray-100">
        {tabs.map(tab => {
          const active = tab.href === activeHref
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                active
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
              }`}
            >
              {tab.Icon && (
                <tab.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
              )}
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
    </div>
  )
}
