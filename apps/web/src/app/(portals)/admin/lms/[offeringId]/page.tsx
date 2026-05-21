import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, ClipboardCheck, MessageSquare, Eye, EyeOff } from 'lucide-react'

export default async function AdminLmsCourseDetailPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [offering, contents, assignments, threads] = await Promise.all([
    prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: true, semester: { include: { academicYear: true } } },
    }),
    prisma.courseContent.findMany({
      where: { tenantId, courseOfferingId: offeringId },
      orderBy: { order: 'asc' },
    }),
    prisma.assignment.findMany({
      where: { tenantId, courseOfferingId: offeringId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.discussionThread.findMany({
      where: { tenantId, courseOfferingId: offeringId },
      include: { _count: { select: { posts: true } } },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      take: 5,
    }),
  ])

  if (!offering) redirect('/admin/lms')

  const contentTypeColor: Record<string, string> = {
    PDF: 'bg-blue-50 text-blue-700',
    VIDEO: 'bg-blue-100 text-blue-800',
    LINK: 'bg-blue-50 text-blue-600',
    DOCUMENT: 'bg-gray-100 text-gray-700',
    IMAGE: 'bg-gray-50 text-gray-600',
    AUDIO: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/lms" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{offering.course.title}</h1>
          <p className="text-gray-500">
            {offering.course.code} · {offering.semester.academicYear.name} · {offering.semester.name}
          </p>
        </div>
      </div>

      {/* Course Materials */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Course Materials ({contents.length})</h2>
          </div>
        </div>
        {contents.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No materials uploaded yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contents.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${contentTypeColor[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {c.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.title}</p>
                    {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.isPublished ? (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <Eye className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Assignments ({assignments.length})</h2>
        </div>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No assignments yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignments.map((a) => {
              const isOverdue = new Date(a.dueDate) < new Date()
              return (
                <div key={a.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className={`text-xs ${isOverdue ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                      Due {new Date(a.dueDate).toLocaleDateString()} · Max {a.maxScore} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{a._count.submissions} submissions</span>
                    {a.isPublished ? (
                      <span className="text-xs text-blue-600">Published</span>
                    ) : (
                      <span className="text-xs text-gray-400">Draft</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Discussion Threads */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Discussions ({threads.length})</h2>
        </div>
        {threads.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No discussions yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {threads.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2">
                  {t.isPinned && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Pinned</span>}
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                </div>
                <span className="text-sm text-gray-400">{t._count.posts} replies</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
