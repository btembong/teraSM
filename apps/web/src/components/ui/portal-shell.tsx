'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { SidebarNav } from '@/components/ui/sidebar-nav'

type Portal = 'student' | 'staff' | 'parent'
type AccentColor = 'blue' | 'indigo' | 'violet'

const PORTAL_LABEL: Record<Portal, string> = {
  student: 'Student Portal',
  staff:   'Staff Portal',
  parent:  'Parent Portal',
}

interface PortalShellProps {
  portal: Portal
  accentColor?: AccentColor
  user: any
  children: React.ReactNode
}

export function PortalShell({ portal, accentColor = 'blue', user, children }: PortalShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar whenever the route changes
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Prevent body scroll while sidebar drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop sidebar — always visible on lg+ ── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-gray-100 flex-col shadow-sm">
        <SidebarNav portal={portal} accentColor={accentColor} user={user} />
      </aside>

      {/* ── Mobile sidebar drawer + backdrop ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Drawer panel */}
          <div className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col overflow-y-auto flex-shrink-0">
            <SidebarNav portal={portal} accentColor={accentColor} user={user} />
          </div>
          {/* Tap-to-close backdrop */}
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar — hidden on lg+ */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 text-sm truncate">
            {PORTAL_LABEL[portal]}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-in">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
