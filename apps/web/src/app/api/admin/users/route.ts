import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail, sendUsageAlertEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// ── Usage alert helper ────────────────────────────────────────────────────────
async function checkAndSendUsageAlert(opts: {
  tenantId: string
  tenantEmail: string
  adminId: string
  schoolName: string
  studentCap: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
}) {
  const currentCount = await prisma.user.count({
    where: { tenantId: opts.tenantId, role: 'STUDENT' },
  })
  const pct = (currentCount / opts.studentCap) * 100

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Fetch the admin's email & name for the alert
  const admin = await prisma.user.findUnique({
    where: { id: opts.adminId },
    select: { email: true, firstName: true },
  })
  const to        = admin?.email ?? opts.tenantEmail
  const firstName = admin?.firstName ?? 'Admin'

  if (pct >= 95 && (!opts.settings?.usageAlertSentAt95 || opts.settings.usageAlertSentAt95 < oneDayAgo)) {
    await prisma.tenantSettings.update({
      where: { tenantId: opts.tenantId },
      data: { usageAlertSentAt95: new Date() } as any,
    })
    await sendUsageAlertEmail({
      to, firstName,
      schoolName: opts.schoolName,
      currentCount,
      planLimit: opts.studentCap,
      threshold: 95,
    })
  } else if (pct >= 80 && pct < 95 && (!opts.settings?.usageAlertSentAt80 || opts.settings.usageAlertSentAt80 < oneDayAgo)) {
    await prisma.tenantSettings.update({
      where: { tenantId: opts.tenantId },
      data: { usageAlertSentAt80: new Date() } as any,
    })
    await sendUsageAlertEmail({
      to, firstName,
      schoolName: opts.schoolName,
      currentCount,
      planLimit: opts.studentCap,
      threshold: 80,
    })
  }
}

// GET /api/admin/users?role=&search=&page=
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const role     = searchParams.get('role')     ?? ''
  const search   = searchParams.get('search')   ?? ''
  const standing = searchParams.get('standing') ?? ''
  const page     = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit    = 20

  const where: any = { tenantId: session.user.tenantId }
  if (role && role !== 'ALL') where.role = role
  if (standing && standing !== 'ALL') where.academicStanding = standing
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName:  { contains: search, mode: 'insensitive' } },
      { email:     { contains: search, mode: 'insensitive' } },
    ]
  }

  const [rawUsers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, status: true,
        avatarUrl: true, createdAt: true, lastLoginAt: true,
        academicStanding: true, standingNote: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  // Attach StudentProfile data when querying students
  let profileMap: Record<string, { studentId: string; level: number; programName: string | null }> = {}
  if (role === 'STUDENT' || where.role === 'STUDENT') {
    const userIds = rawUsers.map((u: any) => u.id)
    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: userIds } },
      include: { program: { select: { name: true } } },
    })
    profileMap = Object.fromEntries(
      profiles.map((p: any) => [p.userId, {
        studentId:        p.studentId,
        level:            p.level,
        admissionYear:    p.admissionYear,
        expectedGradYear: p.expectedGradYear ?? null,
        cgpa:             p.cgpa,
        totalCredits:     p.totalCredits,
        programName:      p.program?.name ?? null,
        requiredCredits:  p.program?.requiredCredits ?? null,
      }])
    )
  }

  const users = rawUsers.map((u: any) => ({ ...u, ...(profileMap[u.id] ?? {}) }))

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
}

// POST /api/admin/users — create user directly
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { firstName, lastName, email, password, role, phone, dateOfBirth, gender,
    programId, level, admissionYear, expectedGradYear, transferCredits } = await req.json()

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password || !role) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: { tenantId: session.user.tenantId, email: email.toLowerCase() },
  })
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      tenantId: session.user.tenantId,
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      passwordHash,
      role,
      status: 'ACTIVE',
      onboardingComplete: true,
      ...(phone       ? { phone }                                  : {}),
      ...(gender      ? { gender }                                 : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) }     : {}),
    },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, role: true, status: true, createdAt: true,
    },
  })

  // Auto-create StudentProfile for STUDENT role
  if (role === 'STUDENT') {
    const tenantId = session.user.tenantId
    const year = new Date().getFullYear()
    const count = await prisma.studentProfile.count({ where: { tenantId } })
    const seq = String(count + 1).padStart(4, '0')
    const studentId = `STU/${year}/${seq}`

    // Validate programId belongs to tenant if provided
    let resolvedProgramId: string | null = null
    if (programId) {
      const prog = await (prisma as any).program.findFirst({
        where: { id: programId, tenantId },
        select: { id: true },
      })
      resolvedProgramId = prog?.id ?? null
    }

    await (prisma as any).studentProfile.create({
      data: {
        tenantId,
        userId:          user.id,
        studentId,
        admissionYear:   admissionYear   ? Number(admissionYear)   : year,
        level:           level           ? Number(level)           : 100,
        expectedGradYear:expectedGradYear? Number(expectedGradYear): null,
        totalCredits:    transferCredits ? Number(transferCredits) : 0,
        ...(resolvedProgramId ? { programId: resolvedProgramId } : {}),
      },
    })
  }

  const tenantId = session.user.tenantId

  // Send welcome email + check usage cap (non-blocking)
  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, email: true, studentCap: true, logoUrl: true },
    }),
    prisma.tenantSettings.findUnique({ where: { tenantId } }),
  ])

  sendWelcomeEmail({
    to: user.email,
    firstName: user.firstName,
    schoolName: tenant?.name ?? 'Your School',
    temporaryPassword: password,
    logoUrl:    tenant?.logoUrl,
    brandColor: (settings as any)?.primaryColor,
  }).catch(err => console.error('[welcome email]', err))

  // Usage alert — only for STUDENT role
  if (role === 'STUDENT' && tenant?.studentCap) {
    checkAndSendUsageAlert({
      tenantId,
      tenantEmail: tenant.email,
      adminId: (session.user as any).id,
      schoolName: tenant.name,
      studentCap: tenant.studentCap,
      settings,
    }).catch((err: unknown) => console.error('[usage alert]', err))
  }

  return NextResponse.json(user, { status: 201 })
}
