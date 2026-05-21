import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const approverId = (session.user as any).id
  const body = await req.json()

  if (body.action === 'APPROVE') {
    const request = await prisma.leaveRequest.findFirst({ where: { id, tenantId } })
    if (!request) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    await prisma.leaveBalance.updateMany({
      where: { tenantId, employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year: new Date().getFullYear() },
      data: { used: { increment: request.days }, remaining: { decrement: request.days } },
    })

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  if (body.action === 'REJECT') {
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: approverId, approvedAt: new Date(), rejectedNote: body.note },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
}
