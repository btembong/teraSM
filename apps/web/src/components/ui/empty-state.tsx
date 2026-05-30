import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface Action {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actions?: Action[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { wrap: 'py-10', iconWrap: 'w-14 h-14', icon: 'w-7 h-7',  title: 'text-sm',   desc: 'text-xs', btn: 'text-xs px-3 py-1.5 rounded-lg' },
  md: { wrap: 'py-16', iconWrap: 'w-20 h-20', icon: 'w-9 h-9',  title: 'text-base', desc: 'text-sm', btn: 'text-sm px-4 py-2 rounded-xl'   },
  lg: { wrap: 'py-24', iconWrap: 'w-24 h-24', icon: 'w-11 h-11', title: 'text-lg',  desc: 'text-sm', btn: 'text-sm px-5 py-2.5 rounded-xl' },
}

export function EmptyState({ icon: Icon, title, description, actions = [], size = 'md', className = '' }: EmptyStateProps) {
  const s = SIZE_MAP[size]

  return (
    <div className={`flex flex-col items-center justify-center text-center ${s.wrap} ${className}`}>
      <div className={`${s.iconWrap} rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5`}>
        <Icon className={`${s.icon} text-gray-300`} strokeWidth={1.5} />
      </div>

      <p className={`${s.title} font-bold text-gray-800 mb-1.5`}>{title}</p>

      {description && (
        <p className={`${s.desc} text-gray-400 max-w-xs leading-relaxed mb-6`}>{description}</p>
      )}

      {actions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {actions.map((a, i) => {
            const isPrimary = a.variant === 'primary' || (a.variant === undefined && i === 0)
            const cls = `${s.btn} font-semibold transition-colors ${
              isPrimary
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`
            if (a.href) return <Link key={i} href={a.href} className={cls}>{a.label}</Link>
            return <button key={i} onClick={a.onClick} className={cls}>{a.label}</button>
          })}
        </div>
      )}
    </div>
  )
}
