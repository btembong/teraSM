import { BarChart3, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-8 -mt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Analytics</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Analytics</h1>
            <p className="text-sm text-gray-400 mt-0.5">Attendance, performance, enrollment trends, and grade distribution</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
