import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const jobs = await prisma.job.findMany({
    where: { tenantId, isActive: true },
    include: {
      _count: { select: { applications: true } },
      applications: { where: { studentId: userId }, select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(jobs.map((j) => ({
    ...j,
    myApplication: j.applications[0] ?? null,
    applications: undefined,
  })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const job = await prisma.job.create({
    data: { tenantId, ...body, deadline: body.deadline ? new Date(body.deadline) : null },
  })
  return NextResponse.json(job)
}
