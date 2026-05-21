import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const studentId = (session.user as any).id

  const { jobId, coverLetter } = await req.json()

  const existing = await prisma.jobApplication.findUnique({
    where: { tenantId_jobId_studentId: { tenantId, jobId, studentId } },
  })
  if (existing) return NextResponse.json({ error: 'Already applied' }, { status: 409 })

  const application = await prisma.jobApplication.create({
    data: { tenantId, jobId, studentId, coverLetter: coverLetter || null },
  })
  return NextResponse.json(application)
}
