import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const authorId = (session.user as any).id

  const announcements = await prisma.announcement.findMany({
    where: { tenantId, authorId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(announcements)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const authorId = (session.user as any).id
  const body = await req.json()

  const ann = await prisma.announcement.create({
    data: {
      tenantId,
      authorId,
      title: body.title,
      body: body.body,
      audience: 'ALL',
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? new Date() : null,
    },
  })
  return NextResponse.json(ann, { status: 201 })
}
