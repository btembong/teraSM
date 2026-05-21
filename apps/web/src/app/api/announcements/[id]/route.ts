import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title: body.title,
      body: body.body,
      audience: body.audience,
      isPinned: body.isPinned,
      isPublished: body.isPublished,
      publishedAt: body.isPublished ? new Date() : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    },
  })
  return NextResponse.json(announcement)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  await prisma.announcement.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
