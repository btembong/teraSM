import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// POST — assign an invigilator to an exam
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: examScheduleId } = await params
  const { teacherId, isPrimary } = await req.json()

  const db = prisma as any
  try {
    const inv = await db.examInvigilation.create({
      data: { examScheduleId, teacherId, isPrimary: isPrimary ?? false },
      include: { teacher: { select: { id: true, firstName: true, lastName: true } } },
    })
    return NextResponse.json(inv, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Teacher already assigned to this exam.' }, { status: 409 })
    }
    throw err
  }
}

// DELETE — remove an invigilator (pass teacherId in body)
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: examScheduleId } = await params
  const { teacherId } = await req.json()

  const db = prisma as any
  await db.examInvigilation.deleteMany({ where: { examScheduleId, teacherId } })
  return NextResponse.json({ ok: true })
}
