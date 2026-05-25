import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; docId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId  = (session.user as any).tenantId as string
  const reviewerId = (session.user as any).id as string
  const { id, docId } = await params

  const app = await (prisma as any).admissionApplication.findFirst({
    where: { id, tenantId },
    select: { id: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status, rejectionReason } = await req.json()
  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const doc = await (prisma as any).admissionDocument.update({
    where: { id: docId },
    data: {
      status,
      rejectionReason: rejectionReason ?? null,
      verifiedBy:      status === 'VERIFIED' ? reviewerId : null,
      verifiedAt:      status === 'VERIFIED' ? new Date() : null,
    },
  })

  // If all docs are verified, auto-advance application to DOCS_VERIFIED
  if (status === 'VERIFIED') {
    const allDocs = await (prisma as any).admissionDocument.findMany({
      where: { applicationId: id },
      select: { status: true },
    })
    const allVerified = allDocs.every((d: any) => d.status === 'VERIFIED')
    if (allVerified && allDocs.length > 0) {
      await (prisma as any).admissionApplication.update({
        where: { id },
        data: { status: 'DOCS_VERIFIED' },
      })
    }
  }

  return NextResponse.json(doc)
}
