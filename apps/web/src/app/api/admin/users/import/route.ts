import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

const VALID_ROLES = ['STUDENT', 'TEACHER', 'STAFF', 'PARENT', 'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN', 'TENANT_ADMIN']

// POST /api/admin/users/import
// Body: { rows: { firstName, lastName, email, role, password }[] }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await req.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 })
  }

  const [tenant, tenantSettings] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { name: true, logoUrl: true } }),
    prisma.tenantSettings.findUnique({ where: { tenantId: session.user.tenantId }, select: { primaryColor: true } }),
  ])
  const schoolName = tenant?.name ?? 'Your School'

  // Pre-load all programmes for this tenant so we can resolve programCode → programId
  const allPrograms: { id: string; code: string }[] = await (prisma as any).program.findMany({
    where: { tenantId: session.user.tenantId },
    select: { id: true, code: true },
  })
  const programByCode = new Map(allPrograms.map(p => [p.code.toUpperCase(), p.id]))

  const results: { row: number; email: string; status: 'created' | 'skipped'; reason?: string }[] = []
  let created = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because row 1 is header

    const firstName      = row.firstName?.trim()
    const lastName       = row.lastName?.trim()
    const email          = row.email?.trim().toLowerCase()
    const role           = (row.role?.trim().toUpperCase()) || 'STUDENT'
    const password       = row.password?.trim() || 'ChangeMe123!'
    const level          = row.level          ? Number(row.level)          : 100
    const admissionYear  = row.admissionYear  ? Number(row.admissionYear)  : new Date().getFullYear()
    const transferCredits= row.transferCredits? Number(row.transferCredits): 0
    const programCode    = row.programCode?.trim().toUpperCase() ?? ''
    const resolvedProgramId = programCode ? (programByCode.get(programCode) ?? null) : null

    // Validate
    if (!firstName || !lastName || !email) {
      results.push({ row: rowNum, email: email || '(missing)', status: 'skipped', reason: 'Missing required fields' })
      skipped++
      continue
    }
    if (!email.includes('@')) {
      results.push({ row: rowNum, email, status: 'skipped', reason: 'Invalid email' })
      skipped++
      continue
    }
    if (!VALID_ROLES.includes(role)) {
      results.push({ row: rowNum, email, status: 'skipped', reason: `Unknown role "${role}"` })
      skipped++
      continue
    }

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: { tenantId: session.user.tenantId, email },
    })
    if (existing) {
      results.push({ row: rowNum, email, status: 'skipped', reason: 'Email already exists' })
      skipped++
      continue
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: {
        tenantId: session.user.tenantId,
        email,
        firstName,
        lastName,
        passwordHash,
        role: role as any,
        status: 'ACTIVE',
        // Admin-imported accounts are vouched for by the institution — treat as verified
        emailVerified: new Date(),
        onboardingComplete: true,
      },
      select: { id: true },
    })

    // Auto-create StudentProfile for STUDENT rows with placement data
    if (role === 'STUDENT') {
      const tenantId = session.user.tenantId
      const count = await prisma.studentProfile.count({ where: { tenantId } })
      const seq = String(count + 1).padStart(4, '0')
      const studentId = `STU/${admissionYear}/${seq}`
      await (prisma as any).studentProfile.create({
        data: {
          tenantId,
          userId:       newUser.id,
          studentId,
          admissionYear,
          level,
          totalCredits: transferCredits,
          ...(resolvedProgramId ? { programId: resolvedProgramId } : {}),
        },
      })
    }

    // Send welcome email with the plain-text password (non-blocking)
    sendWelcomeEmail({
      to: email,
      firstName,
      schoolName,
      temporaryPassword: password,
      logoUrl:    tenant?.logoUrl,
      brandColor: tenantSettings?.primaryColor,
    }).catch(err => console.error('[import welcome email]', err))

    results.push({ row: rowNum, email, status: 'created' })
    created++
  }

  return NextResponse.json({ created, skipped, results })
}
