import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

// POST /api/finance/payment-schedules/[id]/apply
// Body: { invoiceId }
// Creates/replaces a PaymentPlan on the invoice with installments from the schedule.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string
  const { id: scheduleId } = await params

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 })

  // Load schedule with items
  const schedule = await (prisma as any).semesterPaymentSchedule.findFirst({
    where: { id: scheduleId, tenantId, isActive: true },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!schedule) return NextResponse.json({ error: 'Schedule not found or inactive' }, { status: 404 })

  // Load invoice
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: { paymentPlan: { include: { installments: true } } },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED')
    return NextResponse.json({ error: 'Cannot apply schedule to a paid or cancelled invoice' }, { status: 409 })

  // Calculate installment amounts from percentages
  const installments = (schedule.items as any[]).map((item: any) => ({
    dueDate:   item.dueDate,
    amount:    parseFloat(((item.percentage / 100) * invoice.totalAmount).toFixed(2)),
    label:     item.label,
    percentage: item.percentage,
  }))

  // Rounding correction — adjust last installment so total equals invoice amount exactly
  const computedTotal = installments.reduce((s: number, i: any) => s + i.amount, 0)
  const diff = parseFloat((invoice.totalAmount - computedTotal).toFixed(2))
  if (diff !== 0) installments[installments.length - 1].amount += diff

  // Replace existing PaymentPlan atomically
  await prisma.$transaction(async (tx) => {
    // Delete existing plan if any
    const existing = await (tx as any).paymentPlan.findUnique({ where: { invoiceId } })
    if (existing) {
      await (tx as any).paymentPlanInstallment.deleteMany({ where: { planId: existing.id } })
      await (tx as any).paymentPlan.delete({ where: { id: existing.id } })
    }

    // Create new plan
    await (tx as any).paymentPlan.create({
      data: {
        tenantId,
        invoiceId,
        studentId:      invoice.studentId,
        scheduleId,
        totalAmount:    invoice.totalAmount,
        numInstallments: installments.length,
        status:         'ACTIVE',
        installments: {
          create: installments.map((inst: any) => ({
            dueDate: new Date(inst.dueDate),
            amount:  inst.amount,
            status:  new Date(inst.dueDate) < new Date() ? 'OVERDUE' : 'PENDING',
          })),
        },
      },
    })
  })

  // Return updated plan
  const plan = await (prisma as any).paymentPlan.findUnique({
    where: { invoiceId },
    include: { installments: { orderBy: { dueDate: 'asc' } } },
  })

  return NextResponse.json({ plan, schedule: { name: schedule.name } })
}
