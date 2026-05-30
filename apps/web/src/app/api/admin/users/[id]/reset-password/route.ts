import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// POST /api/admin/users/[id]/reset-password
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { password } = await req.json()

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  // Send password reset email (non-blocking)
  const [tenant, tenantSettings] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { name: true, logoUrl: true } }),
    prisma.tenantSettings.findUnique({ where: { tenantId: session.user.tenantId }, select: { primaryColor: true } }),
  ])
  sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    schoolName: tenant?.name ?? 'Your School',
    newPassword: password,
    logoUrl:    tenant?.logoUrl,
    brandColor: tenantSettings?.primaryColor,
  }).catch(err => console.error('[reset password email]', err))

  return NextResponse.json({ success: true })
}
