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
  const existingUser = await prisma.user.findFirst({ where: { tenantId, email: app.email } })
  if (existingUser) {
    const updated = await (prisma as any).admissionApplication.update({
      where: { id },
      data: { convertedUserId: existingUser.id, enrolledAt: new Date(), status: 'ACCEPTED' },
    })
    return NextResponse.json({ userId: existingUser.id, application: updated })
  }

  // Generate temp password
  const tempPassword  = Math.random().toString(36).slice(-8).toUpperCase()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  // ── Generate unique student ID e.g. STU/2025/0042 ──────────────────────
  const admissionYear = new Date().getFullYear()
  const existingCount = await prisma.user.count({ where: { tenantId, role: 'STUDENT' } })
  const studentNo     = String(existingCount + 1).padStart(4, '0')
  const studentIdCode = `STU/${admissionYear}/${studentNo}`

  // ── Match programOfInterest to a real Program ───────────────────────────
  let matchedProgramId: string | null = null
  if (app.programOfInterest) {
    const prog = await prisma.program.findFirst({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { equals: app.programOfInterest, mode: 'insensitive' } },
          { code: { equals: app.programOfInterest, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    })
    matchedProgramId = prog?.id ?? null
  }

  // ── Parse entry level to a numeric level ───────────────────────────────
  const entryLevelNum = (() => {
    const raw = (app.entryLevel ?? '').toLowerCase()
    if (raw.includes('200')) return 200
    if (raw.includes('300')) return 300
    if (raw.includes('post') || raw.includes('pg') || raw.includes('master')) return 700
    if (raw.includes('phd') || raw.includes('doctorate')) return 800
    return 100 // default
  })()

  // ── Create user + StudentProfile in a transaction ──────────────────────
  const { user, studentProfile } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId,
        email:             app.email,
        firstName:         app.firstName,
        lastName:          app.lastName,
        phone:             app.phone ?? null,
        role:              'STUDENT',
        status:            'ACTIVE',
        passwordHash:      hashedPassword,
        mustChangePassword: true,
        onboardingComplete: false,
      },
    })

    const studentProfile = await (tx as any).studentProfile.create({
      data: {
        tenantId,
        userId:       user.id,
        studentId:    studentIdCode,
        programId:    matchedProgramId,
        level:        entryLevelNum,
        admissionYear,
        expectedGradYear: matchedProgramId ? undefined : null,
      },
    })

    return { user, studentProfile }
  })

  // ── Auto-create invoice from matching active fee structures ────────────
  let invoiceId: string | null = null
  try {
    const currentSemester = await (prisma as any).semester.findFirst({
      where: { tenantId, isCurrent: true },
      select: { id: true },
    })

    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          // Matches student's program or all programs
          { programId: matchedProgramId ?? undefined },
          { programId: null },
        ],
        AND: [
          // Matches student's level or all levels
          { OR: [{ level: entryLevelNum }, { level: null }] },
          // Semester-specific or all semesters
          {
            OR: [
              { semesterId: currentSemester?.id ?? undefined },
              { semesterId: null },
            ],
          },
        ],
      },
      select: { id: true, name: true, amount: true, dueDate: true },
    })

    if (feeStructures.length > 0) {
      // Count existing invoices for reference number
      const invoiceCount = await prisma.invoice.count({ where: { tenantId } })
      const invoiceNo    = `INV-${admissionYear}-${String(invoiceCount + 1).padStart(5, '0')}`
      const totalAmount  = feeStructures.reduce((s, f) => s + f.amount, 0)
      const earliestDue  = feeStructures
        .map(f => f.dueDate)
        .filter(Boolean)
        .sort()[0] ?? null

      const invoice = await prisma.invoice.create({
        data: {
          tenantId,
          studentId:   user.id,
          invoiceNo,
          totalAmount,
          paidAmount:  0,
          status:      'SENT',
          dueDate:     earliestDue,
          items: {
            create: feeStructures.map(f => ({
              tenantId,
              feeStructureId: f.id,
              description:    f.name,
              amount:         f.amount,
              quantity:       1,
            })),
          },
        },
        select: { id: true },
      })
      invoiceId = invoice.id
    }
  } catch (err) {
    // Non-fatal — student is created, invoice can be added manually
    console.error('[convert] auto-invoice failed:', err)
  }

  // ── Link application to new user ────────────────────────────────────────
  const updated = await (prisma as any).admissionApplication.update({
    where: { id },
    data: { convertedUserId: user.id, enrolledAt: new Date(), status: 'ACCEPTED' },
  })

  // ── Welcome email ────────────────────────────────────────────────────────
  const [tenant, tenantSettings] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true } }),
    prisma.tenantSettings.findUnique({ where: { tenantId }, select: { primaryColor: true } }),
  ])
  sendAdmissionEnrolledEmail({
    to:                app.email,
    firstName:         app.firstName,
    schoolName:        tenant?.name ?? 'the school',
    temporaryPassword: tempPassword,
    loginUrl:          `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`,
    logoUrl:    tenant?.logoUrl,
    brandColor: tenantSettings?.primaryColor,
  }).catch(err => console.error('[email] enrolled:', err))

  return NextResponse.json({
    userId:       user.id,
    studentId:    studentIdCode,
    programId:    matchedProgramId,
    invoiceId,
    tempPassword,
    application:  updated,
  })
}
