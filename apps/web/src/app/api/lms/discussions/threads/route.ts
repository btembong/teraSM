import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — list threads for a course offering
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json([])

  const threads = await prisma.discussionThread.findMany({
    where: { tenantId, courseOfferingId },
    include: { _count: { select: { posts: true } } },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  })
  return NextResponse.json(threads)
}

// POST — create a new thread
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id
  const body = await req.json()

  const thread = await prisma.discussionThread.create({
    data: {
      tenantId,
      courseOfferingId: body.courseOfferingId,
      title: body.title,
      authorId: userId,
    },
  })
  return NextResponse.json(thread, { status: 201 })
}
