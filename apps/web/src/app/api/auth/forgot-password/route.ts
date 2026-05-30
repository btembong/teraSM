import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendForgotPasswordEmail } from '@/lib/email'
import { createHmac } from 'crypto'
import { rateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

const SECRET          = process.env.NEXTAUTH_SECRET ?? 'dev-secret'
const EXPIRES_MINUTES = 60

// The token includes exp so it times out, AND the user's current passwordHash
// so it is automatically invalidated the moment the password is changed (one-use).
function buildToken(userId: string, email: string, passwordHash: string): string {
  const exp     = Date.now() + EXPIRES_MINUTES * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ userId, email, exp })).toString('base64url')
  // Sign with SECRET + passwordHash — changing password breaks the signature
  const sig     = createHmac('sha256', SECRET + passwordHash).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

// POST /api/auth/forgot-password
// Body: { email: string; slug?: string }
// Always returns 200 to avoid email enumeration.
export async function POST(req: NextRequest) {
  // 5 attempts per IP per 15 minutes
  const ip  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl  = rateLimit(`forgot-pw:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(rateLimitExceededResponse(rl.resetAt), { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, slug } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Resolve tenantId from slug so lookup is scoped to the correct school
  let tenantId: string | undefined
  let resetBaseUrl: string | undefined

  if (slug && typeof slug === 'string') {
    const tenant = await prisma.tenant.findFirst({
      where:  { slug },
      select: { id: true, customDomain: true, slug: true },
    })
    if (tenant) {
      tenantId     = tenant.id
      const host   = tenant.customDomain
        ? `https://${tenant.customDomain}`
        : `https://${tenant.slug}.terasms.com`
      resetBaseUrl = host
    }
  }

  const user = await prisma.user.findFirst({
    where:  tenantId ? { email: normalizedEmail, tenantId } : { email: normalizedEmail },
    select: { id: true, firstName: true, email: true, passwordHash: true },
  })

  if (user?.passwordHash) {
    const token    = buildToken(user.id, user.email, user.passwordHash)
    const base     = resetBaseUrl ?? (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    const resetUrl = `${base}/auth/reset-password?token=${token}`

    sendForgotPasswordEmail({
      to:               user.email,
      firstName:        user.firstName,
      resetUrl,
      expiresInMinutes: EXPIRES_MINUTES,
    }).catch(err => console.error('[forgot-password-email]', err))
  }

  return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
}
