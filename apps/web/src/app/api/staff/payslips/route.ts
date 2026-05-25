import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId   = (session.user as any).id as string
  const tenantId = (session.user as any).tenantId as string

  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true },
  })
  if (!employee) return NextResponse.json([])

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: employee.id, tenantId },
    include: { payrollPeriod: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(payslips)
}
