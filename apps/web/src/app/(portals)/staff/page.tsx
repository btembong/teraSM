import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  BookOpen, Users, ClipboardCheck, Clock, ChevronRight, Video,
  CalendarDays, MapPin, UserCheck, Megaphone, BarChart2, BookMarked,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'
import { OfficeHourActions } from './_components/OfficeHourActions'

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function StaffDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  const db = prisma as any

  const [
    offerings,
    pendingSubmissions,
    todayAttendanceCount,
    upcomingClasses,
    pendingBookings,
    upcomingInvigilation,
  ] = await Promise.all([
    prisma.courseOffering.findMany({
      where: { tenantId, teacherId },
      include: {
        course: true,
        semester: { include: { academicYear: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.submission.count({
      where: { tenantId, status: 'SUBMITTED', assignment: { courseOffering: { teacherId } } },
    }),
    prisma.attendance.count({
      where: {
        tenantId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        courseOffering: { teacherId },
      },
    }),
    prisma.liveClass.findMany({
      where: {
        tenantId,
        teacherId,
        status: { in: ['SCHEDULED', 'LIVE'] },
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
      include: { courseOffering: { include: { course: true } } },
    }),
    // Pending office hour booking requests
    db.officeHourBooking.findMany({
      where: {
        status: 'PENDING',
        slot: { teacherId, isActive: true },
      },
      include: { slot: true },
      orderBy: { bookingDate: 'asc' },
      take: 5,
    }).catch(() => []),
    // Upcoming invigilation assignments
    db.examInvigilation.findMany({
      where: { teacherId, examSchedule: { examDate: { gte: new Date() } } },
      include: {
        examSchedule: {
          include: { courseOffering: { include: { course: true } } },
        },
      },
      orderBy: { examSchedule: { examDate: 'asc' } },
      take: 3,
    }).catch(() => []),
  ])

  // Enrich pending bookings with student info
  const studentIds = [...new Set((pendingBookings as any[]).map((b: any) => b.studentId))]
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds as string[] } },
    select: { id: true, firstName: true, lastName: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const enrichedBookings = (pendingBookings as any[]).map((b: any) => ({
    ...b,
    student: studentMap[b.studentId] ?? null,
    dayName: DAYS[b.slot?.dayOfWeek] ?? '',
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const totalStudents = offerings.reduce((s, o) => s + o._count.enrollments, 0)

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="relative space-y-4">
          <div>
            <p className="text-indigo-200 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{firstName}</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Link href="/staff/attendance"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <ClipboardCheck className="w-3.5 h-3.5" /> Take Attendance
            </Link>
            <Link href="/staff/courses"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <BookMarked className="w-3.5 h-3.5" /> Mark Grades
            </Link>
            <Link href="/staff/live-classes"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <Video className="w-3.5 h-3.5" /> Start Class
            </Link>
            <Link href="/staff/announcements"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <Megaphone className="w-3.5 h-3.5" /> Post Announcement
            </Link>
            <Link href="/staff/analytics"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Courses" value={offerings.length}
          icon={BookOpen} iconBg="bg-indigo-50" iconColor="text-indigo-600"
          href="/staff/courses"
        />
        <StatCard
          label="Total Students" value={totalStudents}
          icon={Users} iconBg="bg-indigo-50" iconColor="text-indigo-600"
        />
        <StatCard
          label="Pending Reviews" value={pendingSubmissions}
          icon={ClipboardCheck} iconBg="bg-amber-50" iconColor="text-amber-600"
          href="/staff/courses"
        />
        <StatCard
          label="Booking Requests" value={enrichedBookings.length}
          icon={UserCheck} iconBg="bg-green-50" iconColor="text-green-600"
          href="/staff/office-hours"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: My Courses + Upcoming Live Classes ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* My Courses */}
          <SectionCard
            title="My Courses"
            icon={BookOpen}
            iconColor="text-indigo-500"
            action={<Link href="/staff/courses" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>}
            noPadding
          >
            {offerings.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses assigned yet"
                description="Contact your administrator to be assigned to course offerings."
                iconBg="bg-indigo-50" iconColor="text-indigo-400"
              />
            ) : (
              <div>
                {offerings.slice(0, 6).map(o => (
                  <SectionRow key={o.id}>
                    <Link href={`/staff/lms/${o.id}`} className="flex items-center justify-between w-full group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                          {o.course.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {o.course.code} · {o.semester.academicYear.name} · {o.semester.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-600">{o._count.enrollments} students</p>
                          <p className="text-xs text-gray-400">{o._count.assignments} assignments</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </Link>
                  </SectionRow>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Upcoming Live Classes */}
          <SectionCard
            title="Upcoming Live Classes"
            icon={Video}
            iconColor="text-indigo-500"
            action={<Link href="/staff/live-classes" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>}
            noPadding
          >
            {upcomingClasses.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No upcoming classes"
                description="Schedule a live class to see it here."
                iconBg="bg-indigo-50" iconColor="text-indigo-400"
                action={
                  <Link href="/staff/live-classes"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">
                    Schedule Class
                  </Link>
                }
              />
            ) : (
              <div>
                {upcomingClasses.map(lc => (
                  <SectionRow key={lc.id}>
                    <Link href={`/staff/live-classes/${lc.id}`} className="flex items-center justify-between w-full group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                          {lc.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {lc.courseOffering.course.code} · {new Date(lc.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`ml-3 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${lc.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                        {lc.status === 'LIVE' ? 'Live now' : 'Scheduled'}
                      </span>
                    </Link>
                  </SectionRow>
                ))}
              </div>
            )}
          </SectionCard>

        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Pending Office Hour Bookings */}
          <SectionCard
            title="Booking Requests"
            icon={UserCheck}
            iconColor="text-green-500"
            action={<Link href="/staff/office-hours" className="text-xs text-indigo-600 hover:underline font-medium">Manage</Link>}
            noPadding
          >
            {enrichedBookings.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No pending requests"
                description="Student booking requests will appear here."
                iconBg="bg-green-50" iconColor="text-green-400"
              />
            ) : (
              <div>
                {enrichedBookings.map((b: any) => (
                  <SectionRow key={b.id}>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {b.student ? `${b.student.firstName} ${b.student.lastName}` : 'Student'}
                        </p>
                        <OfficeHourActions bookingId={b.id} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {b.dayName} · {b.slot ? `${fmt12(b.slot.startTime)} – ${fmt12(b.slot.endTime)}` : ''} · {new Date(b.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {b.note && <p className="text-xs text-gray-500 italic truncate">"{b.note}"</p>}
                    </div>
                  </SectionRow>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Upcoming Invigilation */}
          <SectionCard
            title="Invigilation"
            icon={CalendarDays}
            iconColor="text-purple-500"
            action={<Link href="/staff/invigilation" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>}
            noPadding
          >
            {(upcomingInvigilation as any[]).length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming exams"
                description="Invigilation assignments will appear here."
                iconBg="bg-purple-50" iconColor="text-purple-400"
              />
            ) : (
              <div>
                {(upcomingInvigilation as any[]).map((inv: any) => {
                  const exam = inv.examSchedule
                  const course = exam.courseOffering.course
                  return (
                    <SectionRow key={inv.id}>
                      <div className="space-y-1 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{exam.title}</p>
                          {inv.isPrimary && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{course.code}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(exam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmt12(exam.startTime)}
                          </span>
                          {exam.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {exam.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    </SectionRow>
                  )
                })}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
