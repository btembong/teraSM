import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { sendOtpEmail } from '@/lib/email'
import { rateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

// How long before a new OTP can be requested for the same user
const OTP_RESEND_COOLDOWN_MS = 60 * 1000   // 1 minute
const OTP_TTL_MS             = 10 * 60 * 1000 // 10 minutes
const MAX_FAILED_ATTEMPTS    = 5
const LOCKOUT_MINUTES        = 15

// Roles for which 2FA is mandatory — mirrors auth.ts
const ROLES_REQUIRING_2FA = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN', 'TEACHER', 'STAFF']

function generateOtp(): string {
  // crypto.randomInt is a CSPRNG — safe for auth codes
  return randomInt(100000, 1000000).toString()
}

// CSRF guard: ensure the request originates from our own domain
function isValidOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const allowed = [
    appUrl,
    'http://localhost:3000',
    'http://localhost:3001',
  ]

  // In development allow requests with no origin (server-side tools, Postman)
  if (!origin && process.env.NODE_ENV === 'development') return true

  return allowed.some(a =>
    (origin  && origin.startsWith(a)) ||
    (referer && referer.startsWith(a)),
  )
}

// POST /api/auth/check-2fa
// Body: { email, password, slug? }
// Returns: { requires2fa: boolean }
// If 2FA is required (by flag OR by role), generates + emails an OTP and returns true.
// The client then shows the OTP input and calls signIn('credentials', { email, otp }).
export async function POST(req: NextRequest) {
  // ── Rate limit: 10 attempts per IP per 10 minutes ───────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`check-2fa:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(rateLimitExceededResponse(rl.resetAt), { status: 429 })
  }

  // ── CSRF guard ──────────────────────────────────────────────────────────
  if (!isValidOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, password, slug } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // ── Resolve tenant when slug provided ───────────────────────────────────
  let tenantId: string | undefined
  if (slug && typeof slug === 'string') {
    const tenant = await prisma.tenant.findFirst({ where: { slug }, select: { id: true } })
    tenantId = tenant?.id
  }

  const user = await prisma.user.findFirst({
    where: tenantId ? { email, tenantId } : { email },
    select: {
      id:                  true,
      firstName:           true,
      email:               true,
      passwordHash:        true,
      twoFactorEnabled:    true,
      role:                true,
      status:              true,
      failedLoginAttempts: true,
      lockedUntil:         true,
      otpExpiry:           true,
    },
  })

  // Always return same shape — never leak whether the user exists
  if (!user || !user.passwordHash) {
    return NextResponse.json({ requires2fa: false })
  }

  // ── Account lockout check ────────────────────────────────────────────────
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return NextResponse.json({
      error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
    }, { status: 429 })
  }

  if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    return NextResponse.json({ requires2fa: false })
  }

  // ── Verify password ──────────────────────────────────────────────────────
  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    const attempts = user.failedLoginAttempts + 1
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    })
    // Return false — don't reveal that the password was wrong (same as user-not-found)
    return NextResponse.json({ requires2fa: false })
  }

  // ── Determine if 2FA is required ─────────────────────────────────────────
  const requires2FA = user.twoFactorEnabled || ROLES_REQUIRING_2FA.includes(user.role)
  if (!requires2FA) {
    // Reset failed attempts on correct password even for non-2FA users
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
    }
    return NextResponse.json({ requires2fa: false })
  }

  // ── OTP resend rate-limit: don't spam if a valid OTP was recently sent ───
  if (user.otpExpiry && user.otpExpiry.getTime() - OTP_TTL_MS + OTP_RESEND_COOLDOWN_MS > Date.now()) {
    // OTP was generated less than 1 minute ago — allow re-use of existing OTP
    return NextResponse.json({ requires2fa: true })
  }

  // ── Generate OTP (CSPRNG), bcrypt-hash, store, email ────────────────────
  const otp      = generateOtp()
  const otpHash  = await bcrypt.hash(otp, 10)
  const otpExpiry = new Date(Date.now() + OTP_TTL_MS)

  await prisma.user.update({
    where: { id: user.id },
    data:  { otpCode: otpHash, otpExpiry, failedLoginAttempts: 0, lockedUntil: null },
  })

  sendOtpEmail({
    to:               user.email,
    firstName:        user.firstName,
    otp,
    expiresInMinutes: 10,
  }).catch(err => console.error('[2fa otp email]', err))

  return NextResponse.json({ requires2fa: true })
}
