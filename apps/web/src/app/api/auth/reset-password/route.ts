import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'
import bcrypt from 'bcryptjs'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret'

// Verify token using the user's current passwordHash as part of the signing key.
// This makes the token single-use: once the password changes, the hash changes,
// breaking the signature and invalidating all prior reset links for this user.
async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (Date.now() > data.exp) return null

    // Fetch current passwordHash to reconstruct the expected signature
    const user = await prisma.user.findUnique({
      where:  { id: data.userId },
      select: { passwordHash: true, email: true },
    })
    if (!user?.passwordHash) return null

    const expectedSig = createHmac('sha256', SECRET + user.passwordHash).update(payload).digest('base64url')
    if (sig !== expectedSig) return null

    return { userId: data.userId, email: data.email }
  } catch {
    return null
  }
}

// POST /api/auth/reset-password
// Body: { token: string; password: string }
export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password) {
    return NextResponse.json({ message: 'Token and password are required.' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ message: 'Invalid or expired reset link.' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)

  // Update password + bump sessionVersion to invalidate ALL existing JWTs
  // (including any attacker sessions if the account was compromised)
  await prisma.user.update({
    where: { id: decoded.userId },
    data:  {
      passwordHash:        hashed,
      sessionVersion:      { increment: 1 },
      failedLoginAttempts: 0,
      lockedUntil:         null,
    },
  })

  return NextResponse.json({ message: 'Password updated successfully.' })
}
