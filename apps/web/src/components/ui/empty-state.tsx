import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  iconColor?: string
  iconBg?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconColor = 'text-gray-400',
  iconBg = 'bg-gray-100',
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 px-6 text-center', className)}>
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', iconBg)}>
        <Icon className={cn('w-7 h-7', iconColor)} />
      </div>
      <p className="font-semibold text-gray-900 mb-1">{title}</p>
      {description && <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
