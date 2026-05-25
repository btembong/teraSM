import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/send-notification'
import { NextResponse } from 'next/server'

// Runs every hour — checks assignments due in 24h or less
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 3600000)

  // Assignments due within the next 24 hours that are published
  const assignments = await prisma.assignment.findMany({
    where: {
      isPublished: true,
      dueDate: { gte: now, lte: in24h },
    },
    include: {
      courseOffering: {
        include: {
          course: { select: { code: true, title: true } },
          enrollments: {
            where: { status: 'ENROLLED' },
            select: { studentId: true, tenantId: true },
          },
        },
      },
    },
  })

  let sent = 0

  for (const asgn of assignments) {
    const hoursLeft = Math.round((new Date(asgn.dueDate).getTime() - now.getTime()) / 3600000)
    const timeLabel = hoursLeft <= 1 ? 'less than 1 hour' : `${hoursLeft} hours`

    for (const enr of asgn.courseOffering.enrollments) {
      // Check if student already submitted
      const submitted = await prisma.submission.findFirst({
        where: { assignmentId: asgn.id, studentId: enr.studentId, status: { not: 'DRAFT' } },
      })
      if (submitted) continue

      await notifyUser({
        tenantId: enr.tenantId,
        userId: enr.studentId,
        type: 'GENERAL',
        title: `Assignment Due in ${timeLabel}`,
        body: `"${asgn.title}" (${asgn.courseOffering.course.code}) is due in ${timeLabel}. Submit now.`,
        link: `/student/assignments/${asgn.id}`,
      })
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent })
}
