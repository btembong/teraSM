import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — assign/unassign a department to this faculty
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: facultyId } = await params
  const { departmentId, assign } = await req.json() // assign: true = add, false = remove

  const dept = await prisma.department.findFirst({
    where: { id: departmentId, tenantId: session.user.tenantId },
  })
  if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 })

  await prisma.department.update({
    where: { id: departmentId },
    data: { facultyId: assign ? facultyId : null },
  })

  return NextResponse.json({ success: true })
}
