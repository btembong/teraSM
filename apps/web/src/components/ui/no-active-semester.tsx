import Link from 'next/link'
import { CalendarX } from 'lucide-react'

type Props = {
  /** Label for which page/feature is blocked */
  feature?: string
}

/**
 * Inline guard shown when no semester is ACTIVE.
 * Drop this in any server component page that requires an active semester.
 */
export function NoActiveSemester({ feature }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <CalendarX className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">No active semester</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {feature
          ? `${feature} requires an active academic semester. `
          : 'This section requires an active academic semester. '}
        Launch a semester from the Academic Calendar to continue.
      </p>
      <Link
        href="/admin/academic-calendar"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        Go to Academic Calendar
      </Link>
    </div>
  )
}
