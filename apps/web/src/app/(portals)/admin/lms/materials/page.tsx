import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  FileText, Video, Link as LinkIcon, File, Image, Mic,
  Eye, EyeOff, ChevronRight, Upload,
} from 'lucide-react'

const TYPE_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  PDF:      { label: 'PDF',      Icon: FileText, cls: 'bg-blue-50 text-blue-700' },
  VIDEO:    { label: 'Video',    Icon: Video,    cls: 'bg-blue-100 text-blue-800' },
  LINK:     { label: 'Link',     Icon: LinkIcon, cls: 'bg-gray-100 text-gray-600' },
  DOCUMENT: { label: 'Doc',      Icon: File,     cls: 'bg-gray-100 text-gray-700' },
  IMAGE:    { label: 'Image',    Icon: Image,    cls: 'bg-gray-50 text-gray-600'  },
  AUDIO:    { label: 'Audio',    Icon: Mic,      cls: 'bg-gray-100 text-gray-600' },
  SCORM:    { label: 'SCORM',    Icon: File,     cls: 'bg-blue-50 text-blue-600'  },
}

export default async function LmsMaterialsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const contents = await prisma.courseContent.findMany({
    where: { tenantId },
    include: {
      courseOffering: {
        include: { course: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const published  = contents.filter(c => c.isPublished).length
  const draft      = contents.length - published
  const byType     = contents.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Materials', value: contents.length },
          { label: 'Published',       value: published },
          { label: 'Drafts',          value: draft },
          { label: 'Types',           value: Object.keys(byType).length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown chips */}
      {Object.entries(byType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, count]) => {
            const meta = TYPE_META[type]
            return (
              <span key={type} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${meta?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {meta && <meta.Icon className="w-3.5 h-3.5" />}
                {meta?.label ?? type} · {count}
              </span>
            )
          })}
        </div>
      )}

      {/* Materials table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">All Course Materials</h2>
          <span className="text-xs text-gray-400">{contents.length} items</span>
        </div>

        {contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">No materials uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Go into a course to upload content</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contents.map(c => {
              const meta = TYPE_META[c.type]
              return (
                <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                  {/* Type badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta?.cls.split(' ')[0] ?? 'bg-gray-100'}`}>
                    {meta ? <meta.Icon className={`w-4 h-4 ${meta.cls.split(' ')[1]}`} /> : <File className="w-4 h-4 text-gray-500" />}
                  </div>

                  {/* Title + course */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 truncate">
                        {c.courseOffering.course.code} · {c.courseOffering.course.title}
                      </span>
                    </div>
                  </div>

                  {/* Published status */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <Eye className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>

                  {/* Go to course */}
                  <Link
                    href={`/admin/lms/${c.courseOfferingId}`}
                    className="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
