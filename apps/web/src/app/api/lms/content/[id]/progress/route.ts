import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// POST — mark content as viewed / completed
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: contentId } = await params
  const tenantId = (session.user as any).tenantId
  const studentId = (session.user as any).id
  const body = await req.json().catch(() => ({}))
  const isCompleted: boolean = body.isCompleted ?? true
  const progressPct: number = body.progressPct ?? (isCompleted ? 100 : 50)

  const content = await prisma.courseContent.findUnique({ where: { id: contentId } })
  if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const record = await prisma.contentProgress.upsert({
    where: { studentId_contentId: { studentId, contentId } },
    create: {
      tenantId,
      studentId,
      contentId,
      courseOfferingId: content.courseOfferingId,
      isCompleted,
      progressPct,
      lastAccessedAt: new Date(),
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      isCompleted,
      progressPct: Math.max(progressPct, 0),
      lastAccessedAt: new Date(),
      completedAt: isCompleted ? new Date() : undefined,
    },
  })

  return NextResponse.json(record)
}
