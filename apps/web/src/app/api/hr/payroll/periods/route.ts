import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const periods = await prisma.payrollPeriod.findMany({
    where: { tenantId },
    include: { _count: { select: { payslips: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  return NextResponse.json(periods)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const month = body.month ?? new Date().getMonth() + 1
  const year = body.year ?? new Date().getFullYear()
  const name = `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`

  const period = await prisma.payrollPeriod.create({ data: { tenantId, name, month, year } })

  // Auto-generate payslips for all active employees
  const employees = await prisma.employee.findMany({ where: { tenantId, status: 'ACTIVE' } })
  if (employees.length > 0) {
    await prisma.payslip.createMany({
      data: employees.map((e) => ({
        tenantId,
        employeeId: e.id,
        payrollPeriodId: period.id,
        basicSalary: e.basicSalary,
        allowances: 0,
        deductions: 0,
        netPay: e.basicSalary,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json(period, { status: 201 })
}
