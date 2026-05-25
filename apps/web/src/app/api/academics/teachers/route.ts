import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/academics/teachers — returns all TEACHER users for this tenant
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const teachers = await prisma.user.findMany({
    where: { tenantId, role: 'TEACHER' },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: 'asc' },
  })

  return NextResponse.json(
    teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`.trim() || t.email,
      email: t.email,
    }))
  )
}
