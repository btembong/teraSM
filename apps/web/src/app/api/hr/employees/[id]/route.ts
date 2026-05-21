import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const employee = await prisma.employee.findFirst({
    where: { id, tenantId },
    include: {
      leaveBalances: { include: { leaveType: true } },
      leaveRequests: { include: { leaveType: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      payslips: { include: { payrollPeriod: true }, orderBy: { createdAt: 'desc' }, take: 12 },
    },
  })
  if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const user = await prisma.user.findUnique({ where: { id: employee.userId }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, gender: true } })
  return NextResponse.json({ ...employee, user })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      position: body.position,
      employmentType: body.employmentType,
      status: body.status,
      basicSalary: body.basicSalary,
      contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : undefined,
      bankName: body.bankName,
      bankAccount: body.bankAccount,
      emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone,
      address: body.address,
    },
  })
  return NextResponse.json(employee)
}
