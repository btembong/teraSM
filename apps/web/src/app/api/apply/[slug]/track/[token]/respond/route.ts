import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ slug: string; token: string }> }

// POST /api/apply/[slug]/track/[token]/respond
// Body: { action: 'ACCEPT' | 'DECLINE' }
// Allows an applicant to formally accept or decline their offer online.
export async function POST(req: NextRequest, { params }: Params) {
  const { slug, token } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, status: true },
  })
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const app = await (prisma as any).admissionApplication.findFirst({
    where: { tenantId: tenant.id, trackingToken: token },
    select: { id: true, status: true, offerExpiry: true },
  })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  if (app.status !== 'OFFERED') {
    return NextResponse.json({ error: 'No active offer on this application' }, { status: 409 })
  }

  if (app.offerExpiry && new Date(app.offerExpiry) < new Date()) {
    return NextResponse.json({ error: 'This offer has expired' }, { status: 410 })
  }

  const body   = await req.json().catch(() => ({}))
  const action = body.action as string

  if (action !== 'ACCEPT' && action !== 'DECLINE') {
    return NextResponse.json({ error: 'action must be ACCEPT or DECLINE' }, { status: 400 })
  }

  const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'WITHDRAWN'

  const updated = await (prisma as any).admissionApplication.update({
    where: { id: app.id },
    data: {
      status:     newStatus,
      enrolledAt: action === 'ACCEPT' ? new Date() : null,
    },
    select: { status: true, enrolledAt: true },
  })

  return NextResponse.json({ status: updated.status, enrolledAt: updated.enrolledAt })
}
