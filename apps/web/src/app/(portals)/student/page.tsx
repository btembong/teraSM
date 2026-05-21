import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  BookOpen, DollarSign, BarChart2, ClipboardCheck,
  Bell, ChevronRight, Sparkles, AlertCircle,
} from 'lucide-react'

import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  const [enrollments, grades, invoices, assignments, announcements] = await Promise.all([
    prisma.enrollment.findMany({
      where: { tenantId, studentId, status: 'ENROLLED' },
      take: 5,
      include: { courseOffering: { include: { course: true } } },
    }),
    prisma.grade.findMany({
      where: { tenantId, studentId },
      select: { totalScore: true, letterGrade: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId, studentId, status: { notIn: ['PAID', 'CANCELLED'] } },
      select: { totalAmount: true, paidAmount: true },
    }),
    prisma.assignment.findMany({
      where: {
        tenantId,
        courseOffering: { enrollments: { some: { studentId, status: 'ENROLLED' } } },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { courseOffering: { include: { course: true } } },
    }),
    prisma.announcement.findMany({
      where: { tenantId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  const avgScore = grades.length
    ? grades.reduce((s, g) => s + (g.totalScore ?? 0), 0) / grades.length
    : null
  const outstanding = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-7">

      {/* ── Welcome banner ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{firstName} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {outstanding > 0 && (
              <Link href="/student/fees" className="inline-flex items-center gap-1.5 bg-blue-900/90 hover:bg-blue-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                <AlertCircle className="w-3.5 h-3.5" />
                ${outstanding.toLocaleString()} outstanding
              </Link>
            )}
            <Link href="/student/ai" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Enrolled Courses"
          value={enrollments.length}
          icon={BookOpen}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href="/student/courses"
        />
        <StatCard
          label="Average Score"
          value={avgScore !== null ? `${Math.round(avgScore)}%` : '—'}
          icon={BarChart2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href="/student/grades"
        />
        <StatCard
          label="Outstanding Fees"
          value={outstanding > 0 ? `$${outstanding.toLocaleString()}` : 'All clear'}
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href="/student/fees"
        />
        <StatCard
          label="Due Assignments"
          value={assignments.length}
          icon={ClipboardCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href="/student/assignments"
        />
      </div>

      {/* ── Assignments + Announcements ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        <SectionCard
          title="Upcoming Assignments"
          icon={ClipboardCheck}
          iconColor="text-blue-500"
          action={<Link href="/student/assignments" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="All caught up!"
              description="No upcoming assignments due."
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
          ) : (
            <div>
              {assignments.map((a) => {
                const daysLeft = Math.ceil((new Date(a.dueDate!).getTime() - Date.now()) / 86400000)
                return (
                  <SectionRow key={a.id}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.courseOffering.course.title}</p>
                    </div>
                    <span className={`ml-3 text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 ${
                      daysLeft <= 1 ? 'bg-blue-600 text-white' :
                      daysLeft <= 3 ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                    </span>
                  </SectionRow>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Announcements"
          icon={Bell}
          iconColor="text-blue-500"
          action={<Link href="/student/announcements" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {announcements.length === 0 ? (
            <EmptyState icon={Bell} title="No announcements" iconBg="bg-blue-50" iconColor="text-blue-400" />
          ) : (
            <div>
              {announcements.map((a) => (
                <SectionRow key={a.id} hover>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.body}</p>
                    <p className="text-xs text-gray-300 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Current Courses ── */}
      {enrollments.length > 0 && (
        <SectionCard
          title="Current Courses"
          icon={BookOpen}
          iconColor="text-blue-500"
          action={<Link href="/student/courses" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-50">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/student/courses/${e.courseOfferingId}`}
                className="bg-white px-5 py-4 hover:bg-blue-50/40 transition-colors group flex flex-col gap-2"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-xs">{e.courseOffering.course.code.substring(0, 3)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{e.courseOffering.course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{e.courseOffering.course.code} · {e.courseOffering.course.creditHours} credits</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors self-end mt-auto" />
              </Link>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
