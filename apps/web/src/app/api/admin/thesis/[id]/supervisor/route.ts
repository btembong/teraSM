import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendThesisSupervisorAssignedEmail } from '@/lib/email'

// PATCH /api/admin/thesis/[id]/supervisor — assign/change supervisor
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId, role } = session.user as any
  if (!['TENANT_ADMIN', 'REGISTRAR'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params

  const body = await req.json()
  const { supervisorId } = body

  const thesis = await (prisma as any).thesis.findFirst({ where: { id, tenantId } })
  if (!thesis) return NextResponse.json({ message: 'Not found.' }, { status: 404 })

  let supervisor = null
  if (supervisorId) {
    supervisor = await prisma.user.findFirst({
      where: { id: supervisorId, tenantId, role: { in: ['TEACHER', 'STAFF'] } },
    })
    if (!supervisor) return NextResponse.json({ message: 'Supervisor not found.' }, { status: 400 })
  }

  const [updated, student, tenant] = await Promise.all([
    (prisma as any).thesis.update({
      where: { id },
      data: { supervisorId: supervisorId || null },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    }),
    prisma.user.findUnique({ where: { id: thesis.studentId }, select: { firstName: true, lastName: true, email: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ])

  if (supervisorId && supervisor && student && tenant) {
    sendThesisSupervisorAssignedEmail({
      toStudent: student.email,
      toSupervisor: supervisor.email,
      studentName: `${student.firstName} ${student.lastName}`,
      supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
      schoolName: tenant.name,
      thesisTitle: thesis.title,
    }).catch(err => console.error('[thesis-supervisor-email]', err))
  }

  return NextResponse.json(updated)
}
