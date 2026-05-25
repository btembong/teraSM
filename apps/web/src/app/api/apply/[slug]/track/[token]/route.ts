import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ slug: string; token: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug, token } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true, status: true },
  })
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const app = await (prisma as any).admissionApplication.findFirst({
    where: { tenantId: tenant.id, trackingToken: token },
    select: {
      id: true,
      referenceNumber: true,
      firstName: true,
      lastName: true,
      programOfInterest: true,
      entryLevel: true,
      status: true,
      waitlistPosition: true,
      offerExpiry: true,
      offerLetterUrl: true,
      rejectionReason: true,
      enrolledAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...app, school: { name: tenant.name, logoUrl: tenant.logoUrl } })
}
