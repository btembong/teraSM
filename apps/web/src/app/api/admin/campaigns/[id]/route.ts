import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/campaigns/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const { id } = await params

  const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...(body.type     !== undefined && { type:     body.type }),
      ...(body.title    !== undefined && { title:    body.title.trim() }),
      ...(body.body     !== undefined && { body:     body.body?.trim() || null }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl?.trim() || null }),
      ...(body.ctaText  !== undefined && { ctaText:  body.ctaText?.trim() || null }),
      ...(body.ctaUrl   !== undefined && { ctaUrl:   body.ctaUrl?.trim() || null }),
      ...(body.audience !== undefined && { audience: body.audience }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.startsAt !== undefined && { startsAt: body.startsAt ? new Date(body.startsAt) : null }),
      ...(body.endsAt   !== undefined && { endsAt:   body.endsAt   ? new Date(body.endsAt)   : null }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/campaigns/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const { id } = await params

  const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.campaign.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
