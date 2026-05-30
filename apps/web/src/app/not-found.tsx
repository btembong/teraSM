import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="text-slate-500 font-semibold text-sm">Tera SM</span>
        </div>

        {/* 404 display */}
        <div className="relative mb-6 inline-block">
          <p className="text-[120px] font-black text-gray-100 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
              <Compass className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </Link>
        </div>
      </div>
    </div>
  )
}
