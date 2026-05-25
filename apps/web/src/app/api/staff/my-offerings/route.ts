import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id

  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, teacherId },
    include: { course: { select: { code: true, title: true } }, semester: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(offerings.map(o => ({
    id: o.id,
    course: { code: o.course.code, title: o.course.title },
    semester: o.semester.name,
  })))
}
