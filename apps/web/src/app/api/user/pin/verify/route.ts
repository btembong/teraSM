import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

// POST /api/user/pin/verify
// Used for in-app PIN confirmation (e.g. before a fee payment)
// Body: { pin: string }
// Returns: { valid: true } or 403
export async function POST(req: NextRequest) {
  // IP-level rate limit — 10 attempts per 5 min per IP (DB lockout handles per-user)
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rl = rateLimit(`pin-verify:${ip}`, 10, 5 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(rateLimitExceededResponse(rl.resetAt), { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pin } = await req.json().catch(() => ({}))
  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN is required.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pinHash: true, failedLoginAttempts: true, lockedUntil: true },
  })

  if (!user?.pinHash) {
    return NextResponse.json({ error: 'No PIN set on this account.' }, { status: 404 })
  }

  // Reuse the same lockout field to protect against PIN brute-force
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` },
      { status: 429 }
    )
  }

  const pinMatch = await bcrypt.compare(pin, user.pinHash)

  if (!pinMatch) {
    const attempts = user.failedLoginAttempts + 1
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    })
    return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 403 })
  }

  // Clear failed attempts on success
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })
  }

  return NextResponse.json({ valid: true })
}
