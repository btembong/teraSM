/**
 * POST /api/staff/academic-grades/submit?courseOfferingId=xxx
 *   Marks all DRAFT grades for the offering as SUBMITTED (for admin review).
 *   Only grades that have at least a caScore or examScore are submitted.
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

  // Confirm the offering belongs to this tenant
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    select: { id: true },
  })
  if (!offering) return NextResponse.json({ error: 'Offering not found' }, { status: 404 })

  // Update all DRAFT grades that have at least one score entered
  const result = await prisma.grade.updateMany({
    where: {
      tenantId,
      courseOfferingId,
      status: 'DRAFT',
      OR: [
        { caScore: { not: null } },
        { examScore: { not: null } },
      ],
    },
    data: {
      status:       'SUBMITTED',
      submittedAt:  new Date(),
      submittedById: userId,
    },
  })

  return NextResponse.json({ submitted: result.count })
}
