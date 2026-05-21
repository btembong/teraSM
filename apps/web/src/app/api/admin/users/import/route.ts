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

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true },
  })
  const schoolName = tenant?.name ?? 'Your School'

  const results: { row: number; email: string; status: 'created' | 'skipped'; reason?: string }[] = []
  let created = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because row 1 is header

    const firstName = row.firstName?.trim()
    const lastName  = row.lastName?.trim()
    const email     = row.email?.trim().toLowerCase()
    const role      = (row.role?.trim().toUpperCase()) || 'STUDENT'
    const password  = row.password?.trim() || 'ChangeMe123!'

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
    await prisma.user.create({
      data: {
        tenantId: session.user.tenantId,
        email,
        firstName,
        lastName,
        passwordHash,
        role: role as any,
        status: 'ACTIVE',
        onboardingComplete: true,
      },
    })

    // Send welcome email with the plain-text password (non-blocking)
    sendWelcomeEmail({
      to: email,
      firstName,
      schoolName,
      temporaryPassword: password,
    }).catch(err => console.error('[import welcome email]', err))

    results.push({ row: rowNum, email, status: 'created' })
    created++
  }

  return NextResponse.json({ created, skipped, results })
}
