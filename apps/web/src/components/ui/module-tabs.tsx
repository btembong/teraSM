'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Network, Building2, GraduationCap, BookOpen,
  CalendarDays, DoorOpen, CalendarRange, Award, ScrollText,
  Users, BarChart2, Settings, Bell, CreditCard, FileText,
  ClipboardList, UserCheck, Briefcase, Video, Radio,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Network, Building2, GraduationCap, BookOpen,
  CalendarDays, DoorOpen, CalendarRange, Award, ScrollText,
  Users, BarChart2, Settings, Bell, CreditCard, FileText,
  ClipboardList, UserCheck, Briefcase, Video, Radio,
}

export interface SimpleTab {
  label: string
  href: string
  badge?: number
  group?: string
  icon?: string   // icon name key — resolved client-side from ICON_MAP
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
  const pathname   = usePathname()
  const activeHref = getActiveHref(tabs, pathname)

  return (
    <div className="flex items-center gap-0.5 bg-indigo-100/70 rounded-2xl p-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab, i) => {
        const active        = tab.href === activeHref
        const prevGroup     = i > 0 ? tabs[i - 1].group : undefined
        const showSeparator = i > 0 && tab.group && prevGroup && tab.group !== prevGroup
        const Icon          = tab.icon ? ICON_MAP[tab.icon] : undefined

        return (
          <div key={tab.href} className="flex items-center flex-shrink-0">
            {/* Group separator — thin vertical line */}
            {showSeparator && (
              <div className="w-px h-4 bg-indigo-300/60 mx-1 flex-shrink-0" aria-hidden />
            )}

            <Link
              href={tab.href}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-100'
                  : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold rounded-full ${
                  active ? 'bg-indigo-100 text-indigo-700' : 'bg-white/70 text-slate-500'
                }`}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
