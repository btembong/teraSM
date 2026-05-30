import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/newsletters
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId

  const newsletters = await prisma.newsletter.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(newsletters)
}

// POST /api/admin/newsletters
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const authorId = session.user.id

  const body = await req.json()
  const { subject, previewText, body: htmlBody, audience, scheduledAt } = body

  if (!subject?.trim() || !htmlBody?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const newsletter = await prisma.newsletter.create({
    data: {
      tenantId,
      authorId,
      subject: subject.trim(),
      previewText: previewText?.trim() || null,
      body: htmlBody.trim(),
      audience: audience ?? 'ALL',
      status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(newsletter, { status: 201 })
}
