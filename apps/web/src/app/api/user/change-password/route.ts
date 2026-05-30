import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/user/change-password
// Body: { currentPassword, newPassword }
// Works for both forced first-login change and voluntary changes.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, mustChangePassword: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // If not a forced change, verify current password
  if (!user.mustChangePassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    const valid = user.passwordHash ? await bcrypt.compare(currentPassword, user.passwordHash) : false
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  if (currentPassword && await bcrypt.compare(currentPassword, user.passwordHash ?? '')) {
    // Allow same as current only if not forced
    if (user.mustChangePassword) {
      return NextResponse.json({ error: 'New password must be different from your temporary password' }, { status: 400 })
    }
  }

  const newHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash:      newHash,
      mustChangePassword: false,
      // Bump sessionVersion to invalidate old JWTs so the new token is picked up
      sessionVersion: { increment: 1 },
    },
  })

  return NextResponse.json({ success: true })
}
