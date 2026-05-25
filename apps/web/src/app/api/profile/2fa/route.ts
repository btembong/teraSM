import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { action, password } = await req.json()

  if (!['enable', 'disable'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Require password confirmation for both enable and disable
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, twoFactorEnabled: true },
  })

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Password not set on this account' }, { status: 400 })
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: action === 'enable',
      otpCode: null,
      otpExpiry: null,
    },
  })

  return NextResponse.json({ twoFactorEnabled: action === 'enable' })
}
