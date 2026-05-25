import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  BookOpen, DollarSign, BarChart2, ClipboardCheck,
  Bell, ChevronRight, Sparkles, AlertCircle, CheckCircle2,
  Circle, CalendarDays, MapPin, Clock, Video, Radio,
  TrendingUp, GraduationCap, UserCheck,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

const DAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAY_LABELS: Record<string, string> = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' }

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  const db = prisma as any
  const todayKey = DAY_KEYS[new Date().getDay()]

  // Batch 1 — independent queries
  const [userProfile, enrollments, allGrades, allAttendance, invoices, upcomingAssignments, announcements] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { phone: true, avatarUrl: true, dateOfBirth: true },
      }),
      prisma.enrollment.findMany({
        where: { tenantId, studentId, status: 'ENROLLED' },
        include: {
          courseOffering: {
            include: {
              course: true,
              semester: { include: { academicYear: true } },
              teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.grade.findMany({
        where: { tenantId, studentId },
        select: { totalScore: true, letterGrade: true, courseOfferingId: true },
      }),
      prisma.attendance.findMany({
        where: { tenantId, studentId },
        select: { status: true, courseOfferingId: true },
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

  // Batch 2 — depends on enrollment IDs
  const offeringIds = enrollments.map((e: any) => e.courseOfferingId)

  const [liveClass, upcomingExamsFinal] = await Promise.all([
    prisma.liveClass.findFirst({
      where: { tenantId, status: 'LIVE', courseOfferingId: { in: offeringIds } },
      include: { courseOffering: { include: { course: true } } },
    }).catch(() => null),
    db.examSchedule.findMany({
      where: { courseOfferingId: { in: offeringIds }, examDate: { gte: new Date() } },
      include: { courseOffering: { include: { course: true } } },
      orderBy: { examDate: 'asc' },
      take: 4,
    }).catch(() => []),
  ])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const avgScore = allGrades.length
    ? allGrades.reduce((s, g) => s + (g.totalScore ?? 0), 0) / allGrades.length
    : null

  const totalAttendance = allAttendance.length
  const presentCount = allAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null

  const outstanding = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0)

  // Credit hours: sum from all enrolled courses
  const earnedCredits = enrollments.reduce((s: number, e: any) => s + (e.courseOffering.course.creditHours ?? 3), 0)
  const DEGREE_CREDITS = 120

  // Attendance per offering (for course cards)
  const attByOffering: Record<string, { total: number; present: number }> = {}
  for (const a of allAttendance) {
    if (!attByOffering[a.courseOfferingId]) attByOffering[a.courseOfferingId] = { total: 0, present: 0 }
    attByOffering[a.courseOfferingId].total++
    if (a.status === 'PRESENT' || a.status === 'LATE') attByOffering[a.courseOfferingId].present++
  }

  // Today's schedule from CourseOffering.schedule JSON
  type SlotEntry = { day: string; startTime: string; endTime: string }
  const todayClasses = enrollments
    .flatMap((e: any) => {
      const slots: SlotEntry[] = Array.isArray(e.courseOffering.schedule) ? e.courseOffering.schedule : []
      return slots
        .filter(s => s.day === todayKey)
        .map(s => ({
          ...s,
          course: e.courseOffering.course,
          room: e.courseOffering.room,
          teacher: e.courseOffering.teacher,
          offeringId: e.courseOfferingId,
        }))
    })
    .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))

  // Onboarding checklist
  const checklist = [
    { label: 'Complete your profile',   done: !!(userProfile?.phone && userProfile?.dateOfBirth), href: '/student/onboarding' },
    { label: 'View your courses',        done: enrollments.length > 0,                              href: '/student/courses'    },
    { label: 'Check your timetable',     done: false,                                               href: '/student/timetable'  },
    { label: 'Download your student ID', done: false,                                               href: '/student/id-card'    },
    { label: 'Review your fees',         done: outstanding === 0 && invoices.length > 0,            href: '/student/fees'       },
  ]
  const checklistDone = checklist.filter(c => c.done).length
  const checklistComplete = checklistDone === checklist.length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-blue-200 text-sm">{greeting}</p>
              <h1 className="text-2xl font-bold text-white mt-0.5">{firstName}</h1>
              <p className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {outstanding > 0 && (
              <Link href="/student/fees"
                className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition">
                <AlertCircle className="w-3.5 h-3.5" />
                ${outstanding.toLocaleString()} outstanding
              </Link>
            )}
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Link href="/student/timetable"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <CalendarDays className="w-3.5 h-3.5" /> Timetable
            </Link>
            <Link href="/student/grades"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <BarChart2 className="w-3.5 h-3.5" /> My Grades
            </Link>
            <Link href="/student/fees"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <DollarSign className="w-3.5 h-3.5" /> Pay Fees
            </Link>
            <Link href="/student/office-hours"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition">
              <UserCheck className="w-3.5 h-3.5" /> Book Office Hours
            </Link>
            <Link href="/student/ai"
              className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Ask AI
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live class alert ── */}
      {liveClass && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-red-600 font-semibold text-sm">
              <Radio className="w-4 h-4 animate-pulse" /> Live now
            </span>
            <span className="text-gray-700 text-sm font-medium">
              {(liveClass as any).courseOffering.course.code} — {(liveClass as any).title}
            </span>
          </div>
          <Link href={`/student/live-classes/${(liveClass as any).id}`}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex-shrink-0">
            <Video className="w-4 h-4" /> Join Now
          </Link>
        </div>
      )}

      {/* ── Onboarding checklist ── */}
      {!checklistComplete && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Getting started</p>
              <p className="text-xs text-gray-400">{checklistDone} of {checklist.length} complete</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {Math.round((checklistDone / checklist.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {checklist.map(({ label, done, href }) => (
              <Link key={label} href={done ? '#' : href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${done ? 'bg-gray-50 cursor-default' : 'bg-blue-50 hover:bg-blue-100'}`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                <span className={done ? 'text-gray-400 line-through' : 'text-blue-700 font-medium'}>{label}</span>
                {!done && <ChevronRight className="w-3.5 h-3.5 text-blue-400 ml-auto flex-shrink-0" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Academic stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled Courses" value={enrollments.length}
          icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" href="/student/courses" />
        <StatCard
          label="Avg Score"
          value={avgScore !== null ? `${Math.round(avgScore)}%` : '—'}
          icon={BarChart2} iconBg="bg-indigo-50" iconColor="text-indigo-600" href="/student/grades" />
        <StatCard
          label="Attendance"
          value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
          icon={CheckCircle2}
          iconBg={attendanceRate !== null && attendanceRate < 75 ? 'bg-red-50' : 'bg-green-50'}
          iconColor={attendanceRate !== null && attendanceRate < 75 ? 'text-red-500' : 'text-green-600'}
          href="/student/attendance"
        />
        <StatCard label="Due Assignments" value={upcomingAssignments.length}
          icon={ClipboardCheck}
          iconBg={upcomingAssignments.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}
          iconColor={upcomingAssignments.length > 0 ? 'text-amber-600' : 'text-gray-400'}
          href="/student/assignments" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Academic Progress panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="font-semibold text-gray-900">Academic Progress</p>
            </div>

            {/* Credits bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Credits toward degree</span>
                <span className="font-semibold text-gray-700">{earnedCredits} / {DEGREE_CREDITS}</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((earnedCredits / DEGREE_CREDITS) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round((earnedCredits / DEGREE_CREDITS) * 100)}% of degree complete</p>
            </div>

            {/* CGPA + Attendance inline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs text-indigo-500 font-medium">Avg Score</p>
                <p className="text-2xl font-bold text-indigo-700 mt-0.5">
                  {avgScore !== null ? `${Math.round(avgScore)}%` : '—'}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${attendanceRate !== null && attendanceRate < 75 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className={`text-xs font-medium ${attendanceRate !== null && attendanceRate < 75 ? 'text-red-500' : 'text-green-600'}`}>
                  Attendance
                </p>
                <p className={`text-2xl font-bold mt-0.5 ${attendanceRate !== null && attendanceRate < 75 ? 'text-red-600' : 'text-green-700'}`}>
                  {attendanceRate !== null ? `${attendanceRate}%` : '—'}
                </p>
                {attendanceRate !== null && attendanceRate < 75 && (
                  <p className="text-[10px] text-red-400 mt-0.5">Below 75% threshold</p>
                )}
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-500 font-medium">Credits</p>
                <p className="text-2xl font-bold text-blue-700 mt-0.5">{earnedCredits}</p>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <SectionCard
            title={`Today's Schedule — ${DAY_LABELS[todayKey] ?? ''}`}
            icon={CalendarDays}
            iconColor="text-blue-500"
            action={<Link href="/student/timetable" className="text-xs text-blue-600 hover:underline font-medium">Full timetable</Link>}
            noPadding
          >
            {todayClasses.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No classes today" description="Enjoy your free day." iconBg="bg-blue-50" iconColor="text-blue-300" />
            ) : (
              <div>
                {(todayClasses as any[]).map((cls: any, i: number) => (
                  <SectionRow key={i}>
                    <div className="flex items-center gap-4 w-full">
                      <div className="text-right flex-shrink-0 w-20">
                        <p className="text-xs font-semibold text-gray-700">{fmt12(cls.startTime)}</p>
                        <p className="text-xs text-gray-400">{fmt12(cls.endTime)}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{cls.course.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                          <span>{cls.course.code}</span>
                          {cls.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cls.room}</span>}
                          {cls.teacher && <span>{cls.teacher.firstName} {cls.teacher.lastName}</span>}
                        </div>
                      </div>
                      <Link href={`/student/courses/${cls.offeringId}`}
                        className="flex-shrink-0 text-xs text-blue-600 hover:underline font-medium">
                        Course
                      </Link>
                    </div>
                  </SectionRow>
                ))}
              </div>
            )}
          </SectionCard>

          {/* My Courses grid */}
          {enrollments.length > 0 && (
            <SectionCard
              title="My Courses"
              icon={BookOpen}
              iconColor="text-blue-500"
              action={<Link href="/student/courses" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
            >
              <div className="grid sm:grid-cols-2 gap-3">
                {enrollments.map((e: any) => {
                  const att = attByOffering[e.courseOfferingId]
                  const rate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null
                  const grade = allGrades.find(g => g.courseOfferingId === e.courseOfferingId)
                  return (
                    <Link key={e.id} href={`/student/courses/${e.courseOfferingId}`}
                      className="flex flex-col gap-2 bg-gray-50 hover:bg-blue-50/60 border border-gray-100 rounded-xl p-4 transition group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-bold text-xs">{e.courseOffering.course.code.substring(0, 3)}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {e.courseOffering.course.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.courseOffering.course.code} · {e.courseOffering.course.creditHours} cr</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        {rate !== null && (
                          <span className={`flex items-center gap-1 font-medium ${rate < 75 ? 'text-red-500' : 'text-green-600'}`}>
                            <TrendingUp className="w-3 h-3" /> {rate}% att
                          </span>
                        )}
                        {grade?.letterGrade && (
                          <span className="font-semibold text-indigo-600">{grade.letterGrade}</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">

          {/* Upcoming Assignments */}
          <SectionCard
            title="Assignments Due"
            icon={ClipboardCheck}
            iconColor="text-amber-500"
            action={<Link href="/student/assignments" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
            noPadding
          >
            {upcomingAssignments.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="All caught up!" description="No upcoming assignments." iconBg="bg-green-50" iconColor="text-green-500" />
            ) : (
              <div>
                {upcomingAssignments.map(a => {
                  const daysLeft = Math.ceil((new Date(a.dueDate!).getTime() - Date.now()) / 86400000)
                  return (
                    <SectionRow key={a.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                          <p className="text-xs text-gray-400">{a.courseOffering.course.code}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0 ${
                          daysLeft <= 1 ? 'bg-red-100 text-red-700' :
                          daysLeft <= 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                        </span>
                      </div>
                    </SectionRow>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Upcoming Exams */}
          <SectionCard
            title="Upcoming Exams"
            icon={Clock}
            iconColor="text-purple-500"
            noPadding
          >
            {(upcomingExamsFinal as any[]).length === 0 ? (
              <EmptyState icon={Clock} title="No exams scheduled" iconBg="bg-purple-50" iconColor="text-purple-300" />
            ) : (
              <div>
                {(upcomingExamsFinal as any[]).map((exam: any) => (
                  <SectionRow key={exam.id}>
                    <div className="space-y-1 w-full">
                      <p className="text-sm font-medium text-gray-900 truncate">{exam.title}</p>
                      <p className="text-xs text-gray-400">{exam.courseOffering.course.code}</p>
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
                ))}
              </div>
            )}
          </SectionCard>

          {/* Announcements */}
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
                {announcements.map(a => (
                  <SectionRow key={a.id} hover>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.body}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </SectionRow>
                ))}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
