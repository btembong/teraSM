import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

// PATCH /api/finance/payment-schedules/[id] — update schedule + replace items
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).semesterPaymentSchedule.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, semesterId, templateId, isActive, items } = body

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: 'At least one installment item is required' }, { status: 400 })
    const total = (items as any[]).reduce((s, i) => s + parseFloat(i.percentage ?? 0), 0)
    if (Math.abs(total - 100) > 0.01)
      return NextResponse.json({ error: `Percentages must sum to 100 (got ${total.toFixed(2)})` }, { status: 400 })
    for (const item of items) {
      if (!item.dueDate) return NextResponse.json({ error: 'Each installment must have a due date' }, { status: 400 })
    }
  }

  const updated = await (prisma as any).semesterPaymentSchedule.update({
    where: { id },
    data: {
      ...(name        !== undefined ? { name }                          : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(semesterId  !== undefined ? { semesterId: semesterId  || null }  : {}),
      ...(templateId  !== undefined ? { templateId: templateId  || null }  : {}),
      ...(isActive    !== undefined ? { isActive }                      : {}),
      ...(items !== undefined ? {
        items: {
          deleteMany: {},
          create: (items as any[]).map((item: any, idx: number) => ({
            label:      item.label || `Installment ${idx + 1}`,
            percentage: parseFloat(item.percentage),
            dueDate:    new Date(item.dueDate),
            sortOrder:  item.sortOrder ?? idx,
          })),
        },
      } : {}),
    },
    include: {
      items:    { orderBy: { sortOrder: 'asc' } },
      semester: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/finance/payment-schedules/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).semesterPaymentSchedule.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { paymentPlans: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing._count.paymentPlans > 0)
    return NextResponse.json({
      error: `Cannot delete — this schedule has been applied to ${existing._count.paymentPlans} invoice(s). Deactivate it instead.`,
    }, { status: 409 })

  await (prisma as any).semesterPaymentSchedule.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
