import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const employeeId = req.nextUrl.searchParams.get('employeeId') ?? undefined
  const status = req.nextUrl.searchParams.get('status') ?? undefined

  const requests = await prisma.leaveRequest.findMany({
    where: { tenantId, ...(employeeId ? { employeeId } : {}), ...(status ? { status: status as any } : {}) },
    include: { leaveType: true, employee: true },
    orderBy: { createdAt: 'desc' },
  })

  // Attach user info to each employee
  const userIds = [...new Set(requests.map((r) => r.employee.userId))]
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return NextResponse.json(requests.map((r) => ({ ...r, employee: { ...r.employee, user: userMap[r.employee.userId] } })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const start = new Date(body.startDate)
  const end = new Date(body.endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const request = await prisma.leaveRequest.create({
    data: {
      tenantId,
      employeeId: body.employeeId,
      leaveTypeId: body.leaveTypeId,
      startDate: start,
      endDate: end,
      days,
      reason: body.reason,
    },
  })
  return NextResponse.json(request, { status: 201 })
}
