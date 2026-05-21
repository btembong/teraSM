import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Library, FileText, ClipboardCheck, MessageSquare, ChevronRight } from 'lucide-react'

export default async function AdminLmsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [contentCount, assignmentCount, submissionCount, threadCount, offerings] =
    await Promise.all([
      prisma.courseContent.count({ where: { tenantId } }),
      prisma.assignment.count({ where: { tenantId } }),
      prisma.submission.count({ where: { tenantId, status: 'SUBMITTED' } }),
      prisma.discussionThread.count({ where: { tenantId } }),
      prisma.courseOffering.findMany({
        where: { tenantId },
        include: {
          course: true,
          _count: { select: { contents: true, assignments: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

  const stats = [
    { label: 'Course Materials', value: contentCount, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Assignments', value: assignmentCount, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Reviews', value: submissionCount, icon: ClipboardCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Discussion Threads', value: threadCount, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Management System</h1>
        <p className="text-gray-500">Course content, assignments, and discussions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course offerings list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Course Offerings</h2>
          </div>
        </div>
        {offerings.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No course offerings yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {offerings.map((o) => (
              <Link
                key={o.id}
                href={`/admin/lms/${o.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{o.course.title}</p>
                  <p className="text-sm text-gray-500">{o.course.code} · {o._count.enrollments} students</p>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{o._count.contents} materials</span>
                  <span>{o._count.assignments} assignments</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
