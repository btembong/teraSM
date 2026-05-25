import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { NoActiveSemester } from '@/components/ui/no-active-semester'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

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

export default async function StaffTimetablePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const teacherId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return <NoActiveSemester feature="Timetable" />

  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, teacherId, semesterId: activeSemester.id },
    include: {
      course: { include: { department: true } },
      _count: { select: { enrollments: { where: { status: 'ENROLLED' } } } },
    },
    orderBy: { course: { code: 'asc' } },
  })

  type ClassEntry = {
    courseCode: string
    courseTitle: string
    department: string
    room: string | null
    enrolled: number
    startTime: string
    endTime: string
    offeringId: string
  }

  const timetable: Record<string, ClassEntry[]> = {}
  DAYS.forEach((d) => { timetable[d] = [] })

  for (const o of offerings) {
    const slots = (o.schedule as ScheduleSlot[] | null) ?? []
    for (const slot of slots) {
      const day = slot.day.toUpperCase()
      if (!timetable[day]) continue
      timetable[day].push({
        courseCode: o.course.code,
        courseTitle: o.course.title,
        department: o.course.department.name,
        room: o.room,
        enrolled: o._count.enrollments,
        startTime: slot.startTime,
        endTime: slot.endTime,
        offeringId: o.id,
      })
    }
  }

  DAYS.forEach((d) => {
    timetable[d].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  const activeDays = DAYS.filter((d) => timetable[d].length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {activeSemester.name} — {activeSemester.academicYear.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">{offerings.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Courses Teaching</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">
            {offerings.reduce((s, o) => s + o._count.enrollments, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">{activeDays.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Teaching Days / Week</p>
        </div>
      </div>

      {activeDays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <p className="font-medium text-gray-700">No schedule slots yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {offerings.length === 0
              ? 'You have no courses assigned for this semester.'
              : 'Your courses have no time slots assigned yet. Contact the admin.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDays.map((day) => (
            <div key={day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-indigo-600">
                <Calendar className="w-4 h-4 text-indigo-200" />
                <span className="text-white font-semibold text-sm">{DAY_LABELS[day]}</span>
                <span className="ml-auto text-indigo-200 text-xs">
                  {timetable[day].length} class{timetable[day].length !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {timetable[day].map((cls, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="w-28 flex-shrink-0 text-center">
                      <p className="text-sm font-bold text-indigo-600">{fmt12(cls.startTime)}</p>
                      <p className="text-xs text-gray-400">{fmt12(cls.endTime)}</p>
                    </div>
                    <div className="w-px h-10 bg-indigo-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {cls.courseCode}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 truncate">{cls.courseTitle}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{cls.department}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {cls.room && (
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600 font-medium">{cls.room}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 font-medium">{cls.enrolled}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All courses list */}
      {offerings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">All Assigned Courses</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {offerings.map((o) => (
              <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{o.course.code}</p>
                  <p className="text-xs text-gray-400 truncate">{o.course.title}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  {o._count.enrollments} / {o.maxStudents}
                </div>
                {o.room && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {o.room}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
