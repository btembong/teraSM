import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — student's content progress for a course offering
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json([])

  const progress = await prisma.contentProgress.findMany({
    where: { studentId, courseOfferingId },
    select: { contentId: true, isCompleted: true, progressPct: true, lastAccessedAt: true },
  })

  return NextResponse.json(progress)
}
