/**
 * POST /api/staff/resit-grades/submit?courseOfferingId=xxx
 *   Submits all PENDING resit attempts for the offering (those with an examScore entered).
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'Missing courseOfferingId' }, { status: 400 })

  const result = await prisma.resitAttempt.updateMany({
    where: {
      tenantId,
      courseOfferingId,
      status:    'PENDING',
      examScore: { not: null },
    },
    data: {
      status:       'SUBMITTED',
      submittedAt:  new Date(),
      submittedById: userId,
    },
  })

  return NextResponse.json({ submitted: result.count })
}
