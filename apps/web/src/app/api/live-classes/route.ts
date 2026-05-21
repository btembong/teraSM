import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const courseOfferingId = req.nextUrl.searchParams.get('courseOfferingId') ?? undefined

  const classes = await prisma.liveClass.findMany({
    where: { tenantId, ...(courseOfferingId ? { courseOfferingId } : {}) },
    include: {
      courseOffering: { include: { course: true } },
      _count: { select: { participants: true, recordings: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })
  return NextResponse.json(classes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id
  const body = await req.json()

  const id = `lc${Date.now().toString(36)}`
  const liveClass = await prisma.liveClass.create({
    data: {
      tenantId,
      courseOfferingId: body.courseOfferingId,
      teacherId,
      title: body.title,
      description: body.description,
      scheduledAt: new Date(body.scheduledAt),
      durationMins: body.durationMins ?? 60,
      isRecorded: body.isRecorded ?? false,
      roomName: `${tenantId}-${id}`,
    },
  })
  return NextResponse.json(liveClass, { status: 201 })
}
