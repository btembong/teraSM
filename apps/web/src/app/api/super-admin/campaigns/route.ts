import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendCampaignEmail } from '@/lib/email'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { subject, headline, body, ctaText, ctaUrl, segment, plan } = await req.json()

  if (!subject?.trim() || !headline?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject, headline and body are required' }, { status: 400 })
  }

  // Build tenant filter based on segment
  const tenantWhere: Record<string, unknown> = {}
  if (segment === 'plan' && plan) tenantWhere.plan = plan
  if (segment === 'trial') tenantWhere.status = 'TRIAL'
  if (segment === 'active') tenantWhere.status = 'ACTIVE'

  // Fetch one TENANT_ADMIN per matching tenant
  const admins = await prisma.user.findMany({
    where: {
      role: 'TENANT_ADMIN',
      tenant: Object.keys(tenantWhere).length > 0 ? tenantWhere : undefined,
    },
    select: { email: true, firstName: true, tenantId: true },
    distinct: ['tenantId'],
  })

  if (admins.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Fan-out (non-blocking — resolve in background)
  let sent = 0
  await Promise.allSettled(
    admins.map(admin =>
      sendCampaignEmail({
        to: admin.email,
        firstName: admin.firstName,
        subject,
        headline,
        body,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
      }).then(() => { sent++ })
    )
  )

  return NextResponse.json({ sent })
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const segment = url.searchParams.get('segment') ?? 'all'
  const plan    = url.searchParams.get('plan') ?? undefined

  const tenantWhere: Record<string, unknown> = {}
  if (segment === 'plan' && plan) tenantWhere.plan = plan
  if (segment === 'trial') tenantWhere.status = 'TRIAL'
  if (segment === 'active') tenantWhere.status = 'ACTIVE'

  const count = await prisma.user.count({
    where: {
      role: 'TENANT_ADMIN',
      tenant: Object.keys(tenantWhere).length > 0 ? tenantWhere : undefined,
    },
  })

  return NextResponse.json({ count })
}
