import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const app = await (prisma as any).admissionApplication.findFirst({
    where: { id, tenantId },
    select: { id: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const docs = await (prisma as any).admissionDocument.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(docs)
}
