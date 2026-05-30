import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/student/transcript/requests — list this student's transcript requests
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId   = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const requests = await (prisma as any).transcriptRequest.findMany({
    where: { tenantId, studentId: userId },
    orderBy: { issuedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(requests)
}
