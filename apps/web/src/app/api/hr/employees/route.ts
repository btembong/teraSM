import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const search = req.nextUrl.searchParams.get('search') ?? undefined

  const employees = await prisma.employee.findMany({
    where: {
      tenantId,
      ...(search
        ? { OR: [{ position: { contains: search, mode: 'insensitive' } }, { employeeNo: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    include: {
      leaveBalances: { include: { leaveType: true }, where: { year: new Date().getFullYear() } },
      _count: { select: { leaveRequests: true } },
    },
    orderBy: { hireDate: 'desc' },
  })

  // Attach user info
  const userIds = employees.map((e) => e.userId)
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return NextResponse.json(employees.map((e) => ({ ...e, user: userMap[e.userId] })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const employeeNo = `EMP/${new Date().getFullYear()}/${Date.now().toString(36).toUpperCase()}`

  const employee = await prisma.employee.create({
    data: {
      tenantId,
      employeeNo,
      userId: body.userId,
      departmentId: body.departmentId,
      position: body.position,
      employmentType: body.employmentType ?? 'FULL_TIME',
      hireDate: new Date(body.hireDate),
      contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : undefined,
      basicSalary: body.basicSalary ?? 0,
      bankName: body.bankName,
      bankAccount: body.bankAccount,
      nationalId: body.nationalId,
      emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone,
      address: body.address,
    },
  })
  return NextResponse.json(employee, { status: 201 })
}
