import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendPayslipGeneratedEmail } from '@/lib/email'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const period = await prisma.payrollPeriod.findFirst({
    where: { id, tenantId },
    include: { payslips: { include: { employee: true }, orderBy: { createdAt: 'asc' } } },
  })
  if (!period) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const userIds = period.payslips.map((p) => p.employee.userId)
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return NextResponse.json({
    ...period,
    payslips: period.payslips.map((p) => ({ ...p, employee: { ...p.employee, user: userMap[p.employee.userId] } })),
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  if (body.action === 'PROCESS') {
    const period = await prisma.payrollPeriod.update({ where: { id }, data: { status: 'PROCESSING', processedAt: new Date() } })
    return NextResponse.json(period)
  }

  if (body.action === 'PAY') {
    const [period] = await Promise.all([
      prisma.payrollPeriod.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } }),
      prisma.payslip.updateMany({ where: { payrollPeriodId: id, tenantId }, data: { status: 'PAID', paidAt: new Date() } }),
    ])

    // Notify each employee via email (non-blocking)
    const payslips = await prisma.payslip.findMany({
      where: { payrollPeriodId: id, tenantId },
      include: { employee: { include: { user: { select: { firstName: true, email: true } } } } },
    })
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
    if (tenant) {
      for (const slip of payslips) {
        const user = slip.employee.user
        if (!user?.email) continue
        sendPayslipGeneratedEmail({
          to: user.email,
          firstName: user.firstName,
          schoolName: tenant.name,
          periodLabel: period.name,
          grossPay: slip.grossPay.toFixed(2),
          netPay: slip.netPay.toFixed(2),
          currency: 'USD',
          payslipUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/staff/payslips`,
        }).catch(err => console.error('[payslip-email]', err))
      }
    }

    return NextResponse.json(period)
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
}
