import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/send-notification'
import { NextResponse } from 'next/server'

// Runs every 30 minutes — checks recently ended live classes and notifies absent students
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Classes that ended in the last 35 minutes (catches 30-min cron interval with buffer)
  const windowStart = new Date(now.getTime() - 35 * 60000)

  const endedClasses = await prisma.liveClass.findMany({
    where: {
      status: 'ENDED',
      endedAt: { gte: windowStart, lte: now },
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
      participants: { select: { userId: true } },
    },
  })

  let sent = 0

  for (const lc of endedClasses) {
    const participantIds = new Set(lc.participants.map(p => p.userId))

    for (const enr of lc.courseOffering.enrollments) {
      if (participantIds.has(enr.studentId)) continue // attended

      await notifyUser({
        tenantId: enr.tenantId,
        userId: enr.studentId,
        type: 'MISSED_CLASS',
        title: 'Missed Class',
        body: `You missed the live class "${lc.title}" for ${lc.courseOffering.course.code}. Check for a recording.`,
        link: `/student/live-classes/${lc.id}`,
      })
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent })
}
