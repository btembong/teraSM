import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invite/[token] — public: validate token and return metadata
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { tenant: { select: { name: true, logoUrl: true, slug: true } } },
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  if (invite.useCount >= invite.maxUses) {
    return NextResponse.json({ error: 'This invite link has reached its maximum uses' }, { status: 410 })
  }

  return NextResponse.json({
    tenantName: invite.tenant.name,
    tenantLogo: invite.tenant.logoUrl,
    tenantSlug: invite.tenant.slug,
    role: invite.role,
    email: invite.email, // pre-fill if email-specific
    expiresAt: invite.expiresAt,
  })
}
