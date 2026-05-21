import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const studentId = (session.user as any).id

  const { electionId, manifesto } = await req.json()

  const existing = await prisma.candidate.findUnique({
    where: { tenantId_electionId_studentId: { tenantId, electionId, studentId } },
  })
  if (existing) return NextResponse.json({ error: 'Already nominated' }, { status: 409 })

  const candidate = await prisma.candidate.create({
    data: { tenantId, electionId, studentId, manifesto, status: 'PENDING' },
  })
  return NextResponse.json(candidate)
}
