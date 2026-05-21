import { cn } from '@/lib/utils'

interface SectionCardProps {
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  noPadding?: boolean
}

export function SectionCard({
  title,
  description,
  action,
  icon: Icon,
  iconColor = 'text-gray-400',
  children,
  className,
  bodyClassName,
  noPadding,
}: SectionCardProps) {
  const hasHeader = title || action

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 overflow-hidden', className)}>
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />}
            <div className="min-w-0">
              {title && <p className="font-semibold text-gray-900 text-sm">{title}</p>}
              {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5', bodyClassName)}>{children}</div>
    </div>
  )
}

export function SectionRow({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0',
      hover && 'hover:bg-gray-50/70 transition-colors',
      className,
    )}>
      {children}
    </div>
  )
}
