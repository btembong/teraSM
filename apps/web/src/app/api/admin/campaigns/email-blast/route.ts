import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCampaignEmail } from '@/lib/email'

// POST /api/admin/campaigns/email-blast
// Sends a campaign email to tenant admins. Requires SUPER_ADMIN role.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only platform super admins can send campaigns.' }, { status: 403 })
  }

  const { subject, headline, body, ctaText, ctaUrl, audience, plan } = await req.json().catch(() => ({}))

  if (!subject?.trim() || !headline?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject, headline, and body are required.' }, { status: 400 })
  }

  // ── Build tenant filter ──────────────────────────────────────────────────────
  const planFilter: Record<string, any> = {}
  if (audience === 'TRIAL')   planFilter.trialEndsAt = { gt: new Date() }
  if (audience === 'PAID')    planFilter.trialEndsAt = null
  if (audience === 'BY_PLAN' && plan) planFilter.plan = plan

  // Fetch all TENANT_ADMIN users for matching tenants
  const admins = await prisma.user.findMany({
    where: {
      role:   'TENANT_ADMIN',
      status: 'ACTIVE',
      tenant: Object.keys(planFilter).length > 0 ? planFilter : undefined,
    },
    select: {
      email:     true,
      firstName: true,
      lastName:  true,
    },
  })

  if (admins.length === 0) {
    return NextResponse.json({ sent: 0, failed: [], message: 'No matching recipients.' })
  }

  let sent = 0
  const failed: string[] = []

  // Send in batches of 10 to avoid overwhelming Resend
  for (let i = 0; i < admins.length; i += 10) {
    const batch = admins.slice(i, i + 10)
    await Promise.allSettled(
      batch.map(async admin => {
        try {
          await sendCampaignEmail({
            to:        admin.email,
            firstName: admin.firstName ?? 'there',
            subject,
            headline,
            body,
            ctaText:   ctaText || undefined,
            ctaUrl:    ctaUrl  || undefined,
          })
          sent++
        } catch {
          failed.push(admin.email)
        }
      })
    )
  }

  return NextResponse.json({ sent, failed, total: admins.length })
}
