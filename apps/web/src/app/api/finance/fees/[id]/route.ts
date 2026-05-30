import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

async function getAdminSession(req?: NextRequest) {
  const session = await auth()
  if (!session?.user) return null
  if (!ALLOWED_ROLES.includes((session.user as any).role)) return null
  return session
}

// PATCH /api/finance/fees/[id] — update a fee structure
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await prisma.feeStructure.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const data: Record<string, any> = {}
  if (body.name        !== undefined) data.name             = body.name
  if (body.description !== undefined) data.description      = body.description || null
  if (body.amount      !== undefined) data.amount           = parseFloat(body.amount)
  if (body.billingPeriod !== undefined) data.billingPeriod  = body.billingPeriod
  if (body.semesterId  !== undefined) data.semesterId       = body.semesterId || null
  if (body.level       !== undefined) data.level            = body.level ? parseInt(body.level) : null
  if (body.programId   !== undefined) data.programId        = body.programId || null
  if (body.isRecurring !== undefined) data.isRecurring      = body.isRecurring
  if (body.dueDate     !== undefined) data.dueDate          = body.dueDate ? new Date(body.dueDate) : null
  if (body.lateFee     !== undefined) data.lateFee          = body.lateFee ? parseFloat(body.lateFee) : null
  if (body.lateFeeGraceDays !== undefined) data.lateFeeGraceDays = parseInt(body.lateFeeGraceDays ?? 0)
  if (body.lateFeePercent   !== undefined) data.lateFeePercent   = body.lateFeePercent ? parseFloat(body.lateFeePercent) : null
  if (body.surchargePercent !== undefined) data.surchargePercent = body.surchargePercent ? parseFloat(body.surchargePercent) : null
  if (body.isActive    !== undefined) data.isActive         = body.isActive

  const updated = await prisma.feeStructure.update({ where: { id }, data })
  return NextResponse.json(updated)
}

// DELETE /api/finance/fees/[id] — soft-delete (set isActive: false) or hard delete if no invoice items
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await prisma.feeStructure.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { invoiceItems: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing._count.invoiceItems > 0) {
    // Has invoice history — soft delete only
    await prisma.feeStructure.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ deleted: false, deactivated: true })
  }

  await prisma.feeStructure.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
