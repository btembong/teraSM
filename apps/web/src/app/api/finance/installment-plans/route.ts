import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

// GET /api/finance/installment-plans — list all plan templates
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const plans = await (prisma as any).installmentPlanTemplate.findMany({
    where: { tenantId },
    include: { items: { orderBy: { daysOffset: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(plans)
}

// POST /api/finance/installment-plans — create a plan template
// Body: { name, description?, numInstallments, items: [{ label, percentage, daysOffset }] }
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string

  const body = await req.json()
  const { name, description, items } = body

  if (!name || !Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'name and items[] required' }, { status: 400 })

  // Validate percentages sum to 100
  const total = items.reduce((s: number, i: any) => s + parseFloat(i.percentage ?? 0), 0)
  if (Math.abs(total - 100) > 0.01)
    return NextResponse.json({ error: `Percentages must sum to 100 (got ${total.toFixed(2)})` }, { status: 400 })

  const plan = await (prisma as any).installmentPlanTemplate.create({
    data: {
      tenantId,
      name,
      description: description || null,
      numInstallments: items.length,
      items: {
        create: items.map((item: any, idx: number) => ({
          label:      item.label      || `Installment ${idx + 1}`,
          percentage: parseFloat(item.percentage),
          daysOffset: parseInt(item.daysOffset ?? 0),
        })),
      },
    },
    include: { items: { orderBy: { daysOffset: 'asc' } } },
  })

  return NextResponse.json(plan, { status: 201 })
}
