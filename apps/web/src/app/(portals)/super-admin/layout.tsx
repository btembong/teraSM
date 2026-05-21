'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Building2, Users, CreditCard, Activity, LogOut } from 'lucide-react'
const nav = [
  { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/tenants', label: 'Schools', icon: Building2 },
  { href: '/super-admin/users', label: 'Users', icon: Users },
  { href: '/super-admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/super-admin/audit', label: 'Audit Logs', icon: Activity },
]

function SuperAdminSidebar() {
  const pathname = usePathname()

  return (
    <>
      <div className="h-16 flex items-center px-5 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">Tera SM</p>
            <p className="text-xs text-blue-400 leading-none mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group ${isActive ? 'bg-blue-900/50 text-blue-200 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-800 flex-shrink-0">
        <Link href="/api/auth/signout" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors group">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </Link>
      </div>
    </>
  )
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <SuperAdminSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 animate-in">{children}</div>
      </main>
    </div>
  )
}
