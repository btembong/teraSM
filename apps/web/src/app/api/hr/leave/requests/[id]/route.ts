import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendLeaveDecisionEmail } from '@/lib/email'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const approverId = (session.user as any).id
  const body = await req.json()

  if (body.action === 'APPROVE') {
    const request = await prisma.leaveRequest.findFirst({
      where: { id, tenantId },
      include: {
        employee: { select: { userId: true } },
        leaveType: { select: { name: true } },
      },
    })
    if (!request) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    await prisma.leaveBalance.updateMany({
      where: { tenantId, employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year: new Date().getFullYear() },
      data: { used: { increment: request.days }, remaining: { decrement: request.days } },
    })

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    })

    // Notify employee (non-blocking)
    if (request.employee?.userId) {
      const [empUser, tenant] = await Promise.all([
        prisma.user.findUnique({ where: { id: request.employee.userId }, select: { email: true, firstName: true } }),
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
      ])
      if (empUser) {
        sendLeaveDecisionEmail({
          to: empUser.email,
          firstName: empUser.firstName,
          schoolName: tenant?.name ?? 'Your School',
          leaveType: request.leaveType.name,
          startDate: request.startDate,
          endDate: request.endDate,
          days: request.days,
          status: 'APPROVED',
        }).catch(err => console.error('[leave approve email]', err))
      }
    }

    return NextResponse.json(updated)
  }

  if (body.action === 'REJECT') {
    const request = await prisma.leaveRequest.findFirst({
      where: { id, tenantId },
      include: {
        employee: { select: { userId: true } },
        leaveType: { select: { name: true } },
      },
    })
    if (!request) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: approverId, approvedAt: new Date(), rejectedNote: body.note },
    })

    // Notify employee (non-blocking)
    if (request.employee?.userId) {
      const [empUser, tenant] = await Promise.all([
        prisma.user.findUnique({ where: { id: request.employee.userId }, select: { email: true, firstName: true } }),
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
      ])
      if (empUser) {
        sendLeaveDecisionEmail({
          to: empUser.email,
          firstName: empUser.firstName,
          schoolName: tenant?.name ?? 'Your School',
          leaveType: request.leaveType.name,
          startDate: request.startDate,
          endDate: request.endDate,
          days: request.days,
          status: 'REJECTED',
          note: body.note,
        }).catch(err => console.error('[leave reject email]', err))
      }
    }

    return NextResponse.json(updated)
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
}
