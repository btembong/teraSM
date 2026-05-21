import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Users, ClipboardCheck, Clock, ChevronRight, Video } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function StaffDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, teacherId: userId },
    include: {
      course: true,
      semester: { include: { academicYear: true } },
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const [pendingSubmissions, todayAttendance, upcomingClasses] = await Promise.all([
    prisma.submission.count({
      where: { tenantId, status: 'SUBMITTED', assignment: { courseOffering: { teacherId: userId } } },
    }),
    prisma.attendance.count({
      where: {
        tenantId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        courseOffering: { teacherId: userId },
      },
    }),
    prisma.liveClass.findMany({
      where: {
        tenantId,
        hostId: userId,
        status: { in: ['SCHEDULED', 'LIVE'] },
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
      include: { courseOffering: { include: { course: true } } },
    }),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-7">

      {/* ── Welcome banner ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{firstName}</h1>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingSubmissions > 0 && (
              <Link href="/staff/assignments" className="inline-flex items-center gap-1.5 bg-blue-900/90 hover:bg-blue-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                <ClipboardCheck className="w-3.5 h-3.5" />
                {pendingSubmissions} to review
              </Link>
            )}
            <Link href="/staff/live-classes" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
              <Video className="w-4 h-4" />
              Live Classes
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Courses" value={offerings.length} icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" href="/staff/courses" />
        <StatCard label="Total Students" value={offerings.reduce((s, o) => s + o._count.enrollments, 0)} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Pending Reviews" value={pendingSubmissions} icon={ClipboardCheck} iconBg="bg-blue-50" iconColor="text-blue-600" href="/staff/assignments" />
        <StatCard label="Today's Attendance" value={todayAttendance} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" href="/staff/attendance" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── My Courses ── */}
        <SectionCard
          title="My Courses"
          icon={BookOpen}
          iconColor="text-blue-500"
          action={<Link href="/staff/courses" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {offerings.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses assigned yet" description="Contact your administrator to be assigned to course offerings." iconBg="bg-blue-50" iconColor="text-blue-400" />
          ) : (
            <div>
              {offerings.slice(0, 6).map((o) => (
                <SectionRow key={o.id}>
                  <Link href={`/staff/courses/${o.id}`} className="flex items-center justify-between w-full group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">{o.course.title}</p>
                      <p className="text-xs text-gray-400">{o.course.code} · {o.semester.academicYear.name} · {o.semester.name}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-medium text-gray-600">{o._count.enrollments} students</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Upcoming Live Classes ── */}
        <SectionCard
          title="Upcoming Live Classes"
          icon={Video}
          iconColor="text-blue-500"
          action={<Link href="/staff/live-classes" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {upcomingClasses.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No upcoming classes"
              description="Schedule a live class to see it here."
              iconBg="bg-blue-50"
              iconColor="text-blue-400"
              action={
                <Link href="/staff/live-classes" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                  Schedule Class
                </Link>
              }
            />
          ) : (
            <div>
              {upcomingClasses.map((lc) => (
                <SectionRow key={lc.id}>
                  <Link href={`/staff/live-classes/${lc.id}`} className="flex items-center justify-between w-full group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">{lc.title}</p>
                      <p className="text-xs text-gray-400">{lc.courseOffering.course.code} · {new Date(lc.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${lc.status === 'LIVE' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      {lc.status === 'LIVE' ? 'Live now' : 'Scheduled'}
                    </span>
                  </Link>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
