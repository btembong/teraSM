import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

// PATCH /api/finance/installment-plans/[id] — update plan template + replace items
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).installmentPlanTemplate.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, isActive, items } = body

  // Validate percentages if items provided
  if (items) {
    const total = (items as any[]).reduce((s, i) => s + parseFloat(i.percentage ?? 0), 0)
    if (Math.abs(total - 100) > 0.01)
      return NextResponse.json({ error: `Percentages must sum to 100 (got ${total.toFixed(2)})` }, { status: 400 })
  }

  // Update plan + replace items atomically
  const updated = await (prisma as any).installmentPlanTemplate.update({
    where: { id },
    data: {
      ...(name        !== undefined ? { name }               : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(isActive    !== undefined ? { isActive }           : {}),
      ...(items       !== undefined ? { numInstallments: items.length } : {}),
      ...(items !== undefined ? {
        items: {
          deleteMany: {},
          create: (items as any[]).map((item: any, idx: number) => ({
            label:      item.label      || `Installment ${idx + 1}`,
            percentage: parseFloat(item.percentage),
            daysOffset: parseInt(item.daysOffset ?? 0),
          })),
        },
      } : {}),
    },
    include: { items: { orderBy: { daysOffset: 'asc' } } },
  })

  return NextResponse.json(updated)
}

// DELETE /api/finance/installment-plans/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).installmentPlanTemplate.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (prisma as any).installmentPlanTemplate.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
