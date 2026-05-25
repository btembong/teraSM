import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRegistrationConfirmEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// POST /api/invite/[token]/accept — create account from invite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
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
    include: { tenant: { select: { id: true, slug: true, name: true } } },
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
  sendRegistrationConfirmEmail({
    to: user.email,
    firstName: user.firstName,
    schoolName: invite.tenant.name,
  }).catch(err => console.error('[registration confirm email]', err))

  return NextResponse.json({
    success: true,
    tenantSlug: invite.tenant.slug,
    email: user.email,
  })
}
