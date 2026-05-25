/**
 * POST /api/billing/activate
 * Redeems an activation code → activates / upgrades the subscription.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PLAN_STUDENT_CAPS, PLAN_STORAGE_CAPS } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = (session.user as any).tenantId
  const { code } = await req.json() as { code: string }

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Activation code is required' }, { status: 400 })
  }

  const activation = await (prisma as any).activationCode.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { invoice: true },
  })

  if (!activation) {
    return NextResponse.json({ error: 'Invalid activation code.' }, { status: 404 })
  }
  if (activation.tenantId !== tenantId) {
    return NextResponse.json({ error: 'This code is not for your account.' }, { status: 403 })
  }
  if (activation.usedAt) {
    return NextResponse.json({ error: 'This code has already been used.' }, { status: 409 })
  }
  if (new Date() > new Date(activation.expiresAt)) {
    return NextResponse.json({ error: 'This code has expired. Contact support.' }, { status: 410 })
  }

  const { plan, billingCycle, durationMonths, invoiceId } = activation

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

  // Upsert subscription
  const existing = await (prisma as any).subscription.findUnique({ where: { tenantId } })
  if (existing) {
    await (prisma as any).subscription.update({
      where: { tenantId },
      data: {
        plan,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
      },
    })
  } else {
    await (prisma as any).subscription.create({
      data: {
        tenantId,
        plan,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        monthlyPrice: 0,
      },
    })
  }

  // Mark invoice as paid
  await (prisma as any).saasInvoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID', paidAt: now },
  })

  // Mark code as used
  await (prisma as any).activationCode.update({
    where: { id: activation.id },
    data: { usedAt: now },
  })

  // Update tenant plan + caps
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan,
      status: 'ACTIVE',
      studentCap:  PLAN_STUDENT_CAPS[plan as keyof typeof PLAN_STUDENT_CAPS],
      storageCap:  PLAN_STORAGE_CAPS[plan as keyof typeof PLAN_STORAGE_CAPS],
      trialEndsAt: null,
    },
  })

  return NextResponse.json({ success: true, plan, periodEnd })
}
