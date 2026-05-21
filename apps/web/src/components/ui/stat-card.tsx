import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
  iconBg?: string
  href?: string
  trend?: { value: number; label?: string }
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  href,
  trend,
  className,
}: StatCardProps) {
  const content = (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-100 p-5 transition-all',
      href && 'hover:shadow-md hover:border-gray-200 group cursor-pointer',
      className,
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            trend.value > 0 ? 'bg-green-50 text-green-700' : trend.value < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500',
          )}>
            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : trend.value < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
      {trend?.label && <p className="text-xs text-gray-400 mt-0.5">{trend.label}</p>}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
