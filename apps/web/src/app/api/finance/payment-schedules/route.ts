import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

// GET /api/finance/payment-schedules — list all schedules with items + semester name
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const schedules = await (prisma as any).semesterPaymentSchedule.findMany({
    where: { tenantId },
    include: {
      items:    { orderBy: { sortOrder: 'asc' } },
      semester: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
      _count:   { select: { paymentPlans: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(schedules)
}

// POST /api/finance/payment-schedules — create schedule
// Body: { name, description?, semesterId?, templateId?, items: [{ label, percentage, dueDate, sortOrder? }] }
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string

  const body = await req.json()
  const { name, description, semesterId, templateId, items } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'At least one installment item is required' }, { status: 400 })

  const total = items.reduce((s: number, i: any) => s + parseFloat(i.percentage ?? 0), 0)
  if (Math.abs(total - 100) > 0.01)
    return NextResponse.json({ error: `Percentages must sum to 100 (got ${total.toFixed(2)})` }, { status: 400 })

  for (const item of items) {
    if (!item.dueDate) return NextResponse.json({ error: 'Each installment must have a due date' }, { status: 400 })
  }

  const schedule = await (prisma as any).semesterPaymentSchedule.create({
    data: {
      tenantId,
      name,
      description: description || null,
      semesterId:  semesterId  || null,
      templateId:  templateId  || null,
      items: {
        create: items.map((item: any, idx: number) => ({
          label:      item.label || `Installment ${idx + 1}`,
          percentage: parseFloat(item.percentage),
          dueDate:    new Date(item.dueDate),
          sortOrder:  item.sortOrder ?? idx,
        })),
      },
    },
    include: {
      items:    { orderBy: { sortOrder: 'asc' } },
      semester: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(schedule, { status: 201 })
}
