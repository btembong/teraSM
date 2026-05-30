import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/campaigns
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(campaigns)
}

// POST /api/admin/campaigns
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const authorId = session.user.id

  const body = await req.json()
  const { type, title, body: bodyText, imageUrl, ctaText, ctaUrl, audience, startsAt, endsAt, isActive } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      tenantId,
      authorId,
      type:     type ?? 'BANNER',
      title:    title.trim(),
      body:     bodyText?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      ctaText:  ctaText?.trim() || null,
      ctaUrl:   ctaUrl?.trim() || null,
      audience: audience ?? 'ALL',
      isActive: isActive ?? false,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt:   endsAt   ? new Date(endsAt)   : null,
    },
  })

  return NextResponse.json(campaign, { status: 201 })
}
