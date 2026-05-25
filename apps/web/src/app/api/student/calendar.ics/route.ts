import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { NextResponse } from 'next/server'

const DAYS_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
}

const RRULE_DAYS: Record<string, string> = {
  MON: 'MO', TUE: 'TU', WED: 'WE', THU: 'TH', FRI: 'FR', SAT: 'SA', SUN: 'SU',
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function nextWeekday(targetDay: number): Date {
  const d = new Date()
  const diff = (targetDay - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const currentSemester = await getActiveSemester(tenantId)
  if (!currentSemester) return new NextResponse('No active semester', { status: 404 })

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, studentId, status: 'ENROLLED', courseOffering: { semesterId: currentSemester.id } },
    include: {
      courseOffering: {
        include: {
          course: true,
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  // Also get upcoming assignments
  const assignments = await prisma.assignment.findMany({
    where: {
      tenantId,
      isPublished: true,
      dueDate: { gte: new Date() },
      courseOffering: { enrollments: { some: { studentId, status: 'ENROLLED' } } },
    },
    include: { courseOffering: { include: { course: true } } },
    orderBy: { dueDate: 'asc' },
    take: 50,
  })

  // Also get upcoming live classes
  const liveClasses = await prisma.liveClass.findMany({
    where: {
      tenantId,
      scheduledAt: { gte: new Date() },
      status: { in: ['SCHEDULED', 'LIVE'] },
      courseOffering: { enrollments: { some: { studentId, status: 'ENROLLED' } } },
    },
    include: { courseOffering: { include: { course: true } } },
    orderBy: { scheduledAt: 'asc' },
    take: 30,
  })

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tera SM//Student Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${currentSemester.name} Timetable`,
    'X-WR-TIMEZONE:UTC',
  ]

  const semesterEnd = new Date(currentSemester.endDate as any)

  // Weekly recurring events for each class slot
  for (const enr of enrollments) {
    const co = enr.courseOffering
    const slots = (co.schedule as any[] | null) ?? []
    for (const slot of slots) {
      const dayNum = DAYS_MAP[slot.day.toUpperCase()]
      if (dayNum === undefined) continue

      const base = nextWeekday(dayNum)
      const [sh, sm] = slot.startTime.split(':').map(Number)
      const [eh, em] = slot.endTime.split(':').map(Number)

      const dtStart = new Date(base)
      dtStart.setHours(sh, sm, 0, 0)
      const dtEnd = new Date(base)
      dtEnd.setHours(eh, em, 0, 0)

      const teacher = co.teacher as any
      const uid = `class-${co.id}-${slot.day}@terasm`

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${toICSDate(dtStart)}`,
        `DTEND:${toICSDate(dtEnd)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${RRULE_DAYS[slot.day.toUpperCase()]};UNTIL=${toICSDate(semesterEnd)}`,
        `SUMMARY:${co.course.code} - ${co.course.title}`,
        `DESCRIPTION:Lecturer: ${teacher.firstName} ${teacher.lastName}`,
        co.room ? `LOCATION:${co.room}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT',
      )
    }
  }

  // Assignment deadline events
  for (const asgn of assignments) {
    const co = asgn.courseOffering
    const uid = `asgn-${asgn.id}@terasm`
    const dueDate = new Date(asgn.dueDate)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dueDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${dueDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
      `SUMMARY:📝 Due: ${asgn.title} (${co.course.code})`,
      `DESCRIPTION:Assignment due for ${co.course.title}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  // Live class events
  for (const lc of liveClasses) {
    const co = lc.courseOffering
    const start = new Date(lc.scheduledAt)
    const end = new Date(start.getTime() + lc.durationMins * 60000)
    const uid = `live-${lc.id}@terasm`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:🎥 Live: ${lc.title} (${co.course.code})`,
      `DESCRIPTION:Live class for ${co.course.title}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  const ics = lines.filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="timetable.ics"',
    },
  })
}
