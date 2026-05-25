import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const requests = await prisma.maintenanceRequest.findMany({
    where: { tenantId, submittedBy: studentId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(requests)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const { title, description, location, category, priority } = await req.json()

  const request = await prisma.maintenanceRequest.create({
    data: {
      tenantId,
      submittedBy: studentId,
      title,
      description,
      location: location || null,
      category,
      priority,
      status: 'OPEN',
    },
  })
  return NextResponse.json(request)
}
