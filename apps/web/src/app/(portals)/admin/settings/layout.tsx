import { Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-8 -mt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Settings</span>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">School profile, branding, API keys and integrations</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
