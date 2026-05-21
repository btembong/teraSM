import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const courseOfferingId = req.nextUrl.searchParams.get('courseOfferingId') ?? undefined

  const contents = await prisma.courseContent.findMany({
    where: { tenantId, ...(courseOfferingId ? { courseOfferingId } : {}) },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(contents)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const content = await prisma.courseContent.create({
    data: {
      tenantId,
      courseOfferingId: body.courseOfferingId,
      title: body.title,
      description: body.description,
      type: body.type ?? 'LINK',
      url: body.url,
      fileSize: body.fileSize,
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(content, { status: 201 })
}
