import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  // Scope to tenant — prevents cross-tenant edits
  const existing = await prisma.announcement.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(body.type        !== undefined && { type:        body.type }),
      ...(body.title       !== undefined && { title:       body.title }),
      ...(body.body        !== undefined && { body:        body.body }),
      ...(body.imageUrl    !== undefined && { imageUrl:    body.imageUrl    ?? null }),
      ...(body.videoUrl    !== undefined && { videoUrl:    body.videoUrl    ?? null }),
      ...(body.audience    !== undefined && { audience:    body.audience }),
      ...(body.departmentId !== undefined && { departmentId: body.departmentId ?? null }),
      ...(body.yearLevel   !== undefined && { yearLevel:   body.yearLevel ? Number(body.yearLevel) : null }),
      ...(body.programmeId !== undefined && { programmeId: body.programmeId ?? null }),
      ...(body.isPinned    !== undefined && { isPinned:    body.isPinned }),
      ...(body.isPublished !== undefined && {
        isPublished: body.isPublished,
        publishedAt: body.isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      }),
      ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
      ...(body.expiresAt   !== undefined && { expiresAt:   body.expiresAt   ? new Date(body.expiresAt)   : null }),
    } as any,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const existing = await prisma.announcement.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.announcement.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
