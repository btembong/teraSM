import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; docId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id: studentId, docId } = await params

  const db = prisma as any
  const doc = await db.studentDocument.findFirst({ where: { id: docId, tenantId, studentId } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.studentDocument.delete({ where: { id: docId } })
  return NextResponse.json({ ok: true })
}
