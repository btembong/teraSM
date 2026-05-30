import { NextRequest, NextResponse } from 'next/server'
import { otpStore, isExpired } from '@/lib/otp-store'
import { createHmac } from 'crypto'

const SECRET        = process.env.NEXTAUTH_SECRET ?? 'dev-secret'
const TOKEN_TTL_MS  = 30 * 60 * 1000 // 30 minutes to complete registration

function buildEmailToken(email: string): string {
  const exp     = Date.now() + TOKEN_TTL_MS
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url')
  const sig     = createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyEmailToken(token: string): string | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const expected = createHmac('sha256', SECRET).update(payload).digest('base64url')
    if (sig !== expected) return null
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!email || Date.now() > exp) return null
    return email as string
  } catch {
    return null
  }
}

const MAX_WRONG_ATTEMPTS = 5  // lock out after 5 wrong guesses

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json() as { email?: string; code?: string }

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const entry = otpStore.get(email)

    // No OTP found for this email
    if (!entry) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 })
    }

    // Expired
    if (isExpired(entry)) {
      otpStore.delete(email)
      return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 })
    }

    // Too many wrong attempts
    if (entry.attempts > MAX_WRONG_ATTEMPTS) {
      otpStore.delete(email)
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 400 })
    }

    // Wrong code — increment attempt counter
    if (entry.code !== code.trim()) {
      otpStore.set(email, { ...entry, attempts: entry.attempts + 1 })
      const remaining = MAX_WRONG_ATTEMPTS - entry.attempts
      return NextResponse.json(
        { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
        { status: 400 },
      )
    }

    // ✅ Correct — delete so it can't be reused, issue a short-lived email token
    otpStore.delete(email)
    return NextResponse.json({ success: true, verified: true, emailToken: buildEmailToken(email) })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
