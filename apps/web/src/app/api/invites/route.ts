import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInviteEmail } from '@/lib/email'
import { UserRole } from '@prisma/client'

// GET /api/invites — list all invites for this tenant
export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invites = await prisma.invite.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invites)
}

// POST /api/invites — create invite(s)
// Body: { emails?: string[], role: UserRole, expiresInDays?: number, maxUses?: number }
// If emails is empty/omitted → shareable link
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { emails, role, expiresInDays, maxUses } = await req.json()

  const allowedRoles: UserRole[] = [
    'TEACHER', 'STUDENT', 'PARENT', 'STAFF',
    'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN', 'TENANT_ADMIN',
  ]
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined

  // Fetch school branding for email templates
  const [tenant, tenantSettings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true, logoUrl: true },
    }),
    prisma.tenantSettings.findUnique({ where: { tenantId: session.user.tenantId }, select: { primaryColor: true } }),
  ])
  const schoolName = tenant?.name ?? 'Your School'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Shareable link (no emails)
  if (!emails || emails.length === 0) {
    const invite = await prisma.invite.create({
      data: {
        tenantId: session.user.tenantId,
        role,
        createdBy: session.user.id,
        maxUses: maxUses ?? 100,
        expiresAt,
      },
    })
    return NextResponse.json({ invites: [invite] })
  }

  // Email-specific invites
  const uniqueEmails: string[] = [...new Set((emails as string[]).map((e: string) => e.trim().toLowerCase()).filter(Boolean))]
  const created = await Promise.all(
    uniqueEmails.map(async email => {
      const invite = await prisma.invite.create({
        data: {
          tenantId: session.user.tenantId!,
          email,
          role,
          createdBy: session.user.id!,
          maxUses: 1,
          expiresAt,
        },
      })
      // Send invite email (non-blocking — don't fail if email fails)
      sendInviteEmail({
        to: email,
        schoolName,
        role,
        inviteUrl: `${appUrl}/invite/${invite.token}`,
        expiresAt: invite.expiresAt,
        logoUrl:   tenant?.logoUrl,
        brandColor: tenantSettings?.primaryColor,
      }).catch(err => console.error('[invite email]', err))
      return invite
    })
  )

  return NextResponse.json({ invites: created })
}
