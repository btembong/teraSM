import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/send-notification'
import { NextResponse } from 'next/server'

// GET — fetch attendance for a course+date
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  const dateStr = searchParams.get('date')
  if (!courseOfferingId || !dateStr) return NextResponse.json([])

  const date = new Date(dateStr)
  const records = await prisma.attendance.findMany({
    where: { tenantId, courseOfferingId, date },
    select: { studentId: true, status: true, note: true },
  })
  return NextResponse.json(records)
}

// POST — upsert attendance records for a course+date
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id
  const body = await req.json()
  const { courseOfferingId, date: dateStr, records } = body

  const date = new Date(dateStr)

  await Promise.all(
    records.map((r: { studentId: string; status: string; note?: string }) =>
      prisma.attendance.upsert({
        where: {
          tenantId_studentId_courseOfferingId_date: {
            tenantId, studentId: r.studentId, courseOfferingId, date,
          },
        },
        create: {
          tenantId,
          studentId: r.studentId,
          courseOfferingId,
          date,
          status: r.status as any,
          note: r.note ?? null,
          markedById: teacherId,
        },
        update: { status: r.status as any, note: r.note ?? null, markedById: teacherId },
      })
    )
  )

  // Notify absent students (fire-and-forget)
  const absentRecords = records.filter((r: { studentId: string; status: string }) => r.status === 'ABSENT')
  if (absentRecords.length > 0) {
    const offering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: { course: { select: { code: true, title: true } } },
    })
    if (offering) {
      Promise.all(
        absentRecords.map((r: { studentId: string }) =>
          notifyUser({
            tenantId,
            userId: r.studentId,
            type: 'MISSED_CLASS',
            title: 'Absent from Class',
            body: `You were marked absent from ${offering.course.code} — ${offering.course.title} on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
            link: '/student/schedule',
          })
        )
      ).catch(err => console.error('[attendance-notify]', err))
    }
  }

  return NextResponse.json({ ok: true })
}
