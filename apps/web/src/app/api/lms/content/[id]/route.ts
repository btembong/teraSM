import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const content = await prisma.courseContent.update({
    where: { id },
    data: {
      ...body,
      ...(body.isPublished && { publishedAt: new Date() }),
    },
  })
  return NextResponse.json(content)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  await prisma.courseContent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
