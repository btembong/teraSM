import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { NoActiveSemester } from '@/components/ui/no-active-semester'
import { PageHeader } from '@/components/ui/page-header'
import { Calendar, Clock, MapPin, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
}

type ScheduleSlot = { day: string; startTime: string; endTime: string }

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export default async function StudentTimetablePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const currentSemester = await getActiveSemester(tenantId)

  const enrollments = currentSemester
    ? await prisma.enrollment.findMany({
        where: {
          tenantId,
          studentId,
          status: 'ENROLLED',
          courseOffering: { semesterId: currentSemester.id },
        },
        include: {
          courseOffering: {
            include: {
              course: { include: { department: { select: { name: true } } } },
              teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      })
    : []

  // Only include current semester offerings
  const currentEnrollments = enrollments.filter(
    e => e.courseOffering.semesterId === currentSemester?.id
  )

  // Build a map: day → list of class slots
  type ClassEntry = {
    id: string
    courseCode: string
    courseTitle: string
    teacher: string
    room: string | null
    startTime: string
    endTime: string
    offeringId: string
  }

  const timetable: Record<string, ClassEntry[]> = {}
  DAYS.forEach(d => { timetable[d] = [] })

  for (const enr of currentEnrollments) {
    const { courseOffering: co } = enr
    const slots = (co.schedule as ScheduleSlot[] | null) ?? []
    for (const slot of slots) {
      const day = slot.day.toUpperCase()
      if (!timetable[day]) continue
      timetable[day].push({
        id: `${co.id}-${slot.day}`,
        courseCode: co.course.code,
        courseTitle: co.course.title,
        teacher: `${(co.teacher as any).firstName} ${(co.teacher as any).lastName}`,
        room: co.room ?? null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        offeringId: co.id,
      })
    }
  }

  // Sort each day by start time
  DAYS.forEach(d => {
    timetable[d].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  // Upcoming live classes
  const upcomingLive = await prisma.liveClass.findMany({
    where: {
      tenantId,
      scheduledAt: { gte: new Date() },
      status: { in: ['SCHEDULED', 'LIVE'] },
      courseOffering: { enrollments: { some: { studentId, status: 'ENROLLED' } } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
    include: { courseOffering: { include: { course: true } } },
  })

  const activeDays = DAYS.filter(d => timetable[d].length > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description={currentSemester
          ? `${currentSemester.name} — ${currentSemester.academicYear.name}`
          : 'No active semester'}
      />

      {!currentSemester ? (
        <NoActiveSemester feature="Timetable" />
      ) : currentEnrollments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No enrolled courses</p>
          <p className="text-sm text-gray-400 mt-1">Enrol in courses to see your weekly schedule.</p>
        </div>
      ) : (
        <>
          {/* Add to calendar */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&cid=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/student/calendar.ics`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-500" />
              Add to Google Calendar
            </a>
            <a
              href="/api/student/calendar.ics"
              download="timetable.ics"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              Download ICS (Apple / Outlook)
            </a>
          </div>

          {/* Weekly grid */}
          {activeDays.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Schedule slots not yet assigned by admin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDays.map(day => (
                <div key={day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Day header */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-blue-600">
                    <Calendar className="w-4 h-4 text-blue-200" />
                    <span className="text-white font-semibold text-sm">{DAY_LABELS[day]}</span>
                    <span className="ml-auto text-blue-200 text-xs">{timetable[day].length} class{timetable[day].length !== 1 ? 'es' : ''}</span>
                  </div>

                  {/* Slots */}
                  <div className="divide-y divide-gray-50">
                    {timetable[day].map(cls => (
                      <div key={cls.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                        {/* Time */}
                        <div className="w-28 flex-shrink-0 text-center">
                          <p className="text-sm font-bold text-blue-600">{fmt12(cls.startTime)}</p>
                          <p className="text-xs text-gray-400">{fmt12(cls.endTime)}</p>
                        </div>
                        {/* Divider */}
                        <div className="w-px h-10 bg-blue-100 flex-shrink-0" />
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{cls.courseCode}</span>
                            <p className="text-sm font-semibold text-gray-900 truncate">{cls.courseTitle}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{cls.teacher}</p>
                        </div>
                        {/* Room */}
                        {cls.room && (
                          <div className="flex items-center gap-1.5 flex-shrink-0 bg-gray-50 rounded-lg px-3 py-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">{cls.room}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Live Classes */}
          {upcomingLive.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                <Video className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900 text-sm">Upcoming Live Classes</span>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingLive.map(lc => {
                  const d = new Date(lc.scheduledAt)
                  const isLive = lc.status === 'LIVE'
                  return (
                    <div key={lc.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-28 flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-900">
                          {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{lc.title}</p>
                        <p className="text-xs text-gray-400">{lc.courseOffering.course.code} · {lc.durationMins} min</p>
                      </div>
                      {isLive ? (
                        <Link href={`/student/live-classes/${lc.id}`}
                          className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          LIVE
                        </Link>
                      ) : (
                        <Link href={`/student/live-classes/${lc.id}`}
                          className="text-xs text-blue-600 font-medium hover:underline">
                          Join
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Semester dates */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1">Semester Start</p>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(currentSemester.startDate as any).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1">Semester End</p>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(currentSemester.endDate as any).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1">Enrolled Courses</p>
              <p className="text-sm font-semibold text-blue-900">{currentEnrollments.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
