import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendAdmissionEnrolledEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const app = await (prisma as any).admissionApplication.findFirst({
    where: { id, tenantId },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'OFFERED' && app.status !== 'ACCEPTED') {
    return NextResponse.json({ error: 'Application must be OFFERED or ACCEPTED to convert' }, { status: 400 })
  }
  if (app.convertedUserId) {
    return NextResponse.json({ error: 'Already converted to student' }, { status: 409 })
  }

  // Check if user with this email already exists in tenant
  const existingUser = await prisma.user.findFirst({
    where: { tenantId, email: app.email },
  })
  if (existingUser) {
    // Just link the existing user
    const updated = await (prisma as any).admissionApplication.update({
      where: { id },
      data: { convertedUserId: existingUser.id, enrolledAt: new Date(), status: 'ACCEPTED' },
    })
    return NextResponse.json({ userId: existingUser.id, application: updated })
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8).toUpperCase()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  const user = await prisma.user.create({
    data: {
      tenantId,
      email:        app.email,
      firstName:    app.firstName,
      lastName:     app.lastName,
      role:         'STUDENT',
      passwordHash: hashedPassword,
    },
  })

  const updated = await (prisma as any).admissionApplication.update({
    where: { id },
    data: { convertedUserId: user.id, enrolledAt: new Date(), status: 'ACCEPTED' },
  })

  // Send welcome email with login credentials
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
  sendAdmissionEnrolledEmail({
    to:                app.email,
    firstName:         app.firstName,
    schoolName:        tenant?.name ?? 'the school',
    temporaryPassword: tempPassword,
    loginUrl:          `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`,
  }).catch(err => console.error('[email] enrolled:', err))

  return NextResponse.json({
    userId:      user.id,
    tempPassword, // still returned so admin can share it manually if email fails
    application: updated,
  })
}
