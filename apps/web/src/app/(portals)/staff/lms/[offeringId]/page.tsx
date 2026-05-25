import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Eye, EyeOff, ExternalLink, File, Video, Link2, Image, FileAudio } from 'lucide-react'
import { AddContentForm } from './AddContentForm'
import { TogglePublishButton } from './TogglePublishButton'

const TYPE_META: Record<string, { color: string; Icon: any }> = {
  PDF:      { color: 'bg-red-50 text-red-700',     Icon: FileText },
  VIDEO:    { color: 'bg-purple-50 text-purple-700', Icon: Video },
  LINK:     { color: 'bg-blue-50 text-blue-700',    Icon: Link2 },
  DOCUMENT: { color: 'bg-gray-100 text-gray-700',   Icon: File },
  IMAGE:    { color: 'bg-green-50 text-green-700',  Icon: Image },
  AUDIO:    { color: 'bg-amber-50 text-amber-700',  Icon: FileAudio },
}

export default async function StaffMaterialsPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const contents = await prisma.courseContent.findMany({
    where: { tenantId, courseOfferingId: offeringId },
    orderBy: { order: 'asc' },
  })

  const published = contents.filter(c => c.isPublished).length

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Materials', value: contents.length },
          { label: 'Published',       value: published },
          { label: 'Drafts',          value: contents.length - published },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="flex justify-end">
        <AddContentForm offeringId={offeringId} />
      </div>

      {/* Materials list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        {contents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No materials yet. Click "Add Material" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contents.map(c => {
              const meta = TYPE_META[c.type] ?? { color: 'bg-gray-100 text-gray-600', Icon: File }
              const Icon = meta.Icon
              return (
                <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{c.type}</span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    )}
                    <TogglePublishButton
                      id={c.id}
                      type="content"
                      isPublished={c.isPublished}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
