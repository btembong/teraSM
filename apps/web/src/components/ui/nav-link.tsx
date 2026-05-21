'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  activeClass?: string
  inactiveClass?: string
}

export function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  activeClass = 'bg-blue-50 text-blue-700 font-semibold',
  inactiveClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
}: NavLinkProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? activeClass : inactiveClass}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
      {label}
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </Link>
  )
}

export function DarkNavLink({
  href,
  label,
  icon: Icon,
  exact = false,
}: Omit<NavLinkProps, 'activeClass' | 'inactiveClass'>) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-900/60 text-violet-200 font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
      {label}
    </Link>
  )
}
