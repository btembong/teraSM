import { NextRequest, NextResponse } from 'next/server'
import { otpStore, isExpired } from '@/lib/otp-store'

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

    // ✅ Correct — delete so it can't be reused
    otpStore.delete(email)
    return NextResponse.json({ success: true, verified: true })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
