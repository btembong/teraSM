import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/student/offer-letter
// Returns the student's most recent offer letter URL (matched by email)
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId } = session.user as any
  const email = (session.user as any).email

  const application = await prisma.admissionApplication.findFirst({
    where: {
      tenantId,
      email,
      status: { in: ['OFFERED', 'ACCEPTED'] },
      offerLetterUrl: { not: null },
    },
    select: {
      id: true,
      referenceNumber: true,
      offerLetterUrl: true,
      programOfInterest: true,
      status: true,
      offerExpiry: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(application ?? null)
}
