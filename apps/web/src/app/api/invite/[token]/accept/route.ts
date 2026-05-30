import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRegistrationConfirmEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { rateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

// POST /api/invite/[token]/accept — create account from invite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 10 attempts per IP per hour — prevents brute-force on invite tokens
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`invite-accept:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(rateLimitExceededResponse(rl.resetAt), { status: 429 })
  }

  const body = await req.json()
  const { firstName, lastName, password, email: bodyEmail } = body

  if (!firstName?.trim() || !lastName?.trim() || !password || password.length < 8) {
    return NextResponse.json(
      { error: 'All fields required. Password must be at least 8 characters.' },
      { status: 400 }
    )
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { tenant: { select: { id: true, slug: true, name: true, logoUrl: true } } },
  })

  if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  if (invite.useCount >= invite.maxUses) {
    return NextResponse.json({ error: 'This invite link has already been used' }, { status: 410 })
  }

  // Email-specific invite uses the stored email; shareable link requires body email
  const email: string | undefined = invite.email ?? bodyEmail
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check duplicate
  const existing = await prisma.user.findFirst({
    where: { tenantId: invite.tenantId, email: email.toLowerCase() },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Try logging in.' },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      tenantId: invite.tenantId,
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      passwordHash,
      role: invite.role,
      status: 'ACTIVE',
      // Clicking an invite link + setting a password proves email ownership
      emailVerified: new Date(),
      // Students go through their own onboarding wizard on first login
      onboardingComplete: invite.role === 'STUDENT' ? false : true,
    },
  })

  // Increment use count
  await prisma.invite.update({
    where: { token },
    data: { useCount: { increment: 1 } },
  })

  // Send confirmation email (non-blocking)
  prisma.tenantSettings.findUnique({ where: { tenantId: invite.tenantId }, select: { primaryColor: true } })
    .then(settings => sendRegistrationConfirmEmail({
      to: user.email,
      firstName: user.firstName,
      schoolName: invite.tenant.name,
      logoUrl:   invite.tenant.logoUrl,
      brandColor: settings?.primaryColor,
    }))
    .catch(err => console.error('[registration confirm email]', err))

  return NextResponse.json({
    success: true,
    tenantSlug: invite.tenant.slug,
    email: user.email,
  })
}
