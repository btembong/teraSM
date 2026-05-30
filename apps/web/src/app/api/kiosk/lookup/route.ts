import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Simple in-process rate limiter for the kiosk endpoint.
// Keyed by (slug + studentId) to prevent brute-forcing a single account.
// In production with multiple instances, swap for Upstash Redis.
declare global {
  var __kioskAttempts: Map<string, { count: number; lockedUntil: number }> | undefined
}
const attempts: Map<string, { count: number; lockedUntil: number }> =
  global.__kioskAttempts ?? (global.__kioskAttempts = new Map())

const MAX_ATTEMPTS   = 5
const LOCKOUT_MS     = 15 * 60 * 1000  // 15 minutes
const ATTEMPT_TTL_MS = 30 * 60 * 1000  // reset window after 30 min of no failures

function checkRateLimit(key: string): { blocked: boolean; minutesLeft?: number } {
  const entry = attempts.get(key)
  if (!entry) return { blocked: false }
  if (entry.lockedUntil > Date.now()) {
    return { blocked: true, minutesLeft: Math.ceil((entry.lockedUntil - Date.now()) / 60000) }
  }
  return { blocked: false }
}

function recordFailure(key: string) {
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0 }
  entry.count++
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS
  }
  attempts.set(key, entry)
  // Auto-cleanup after TTL
  setTimeout(() => attempts.delete(key), ATTEMPT_TTL_MS)
}

function clearFailures(key: string) {
  attempts.delete(key)
}

// POST /api/kiosk/lookup
// Body: { slug: string; studentId: string; pin: string }
// Returns: limited student snapshot (name, photo, grades summary, fee balance)
// No session auth — public endpoint secured only by studentId + PIN.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { slug, studentId, pin } = body

  if (!slug || !studentId || !pin) {
    return NextResponse.json({ error: 'slug, studentId, and pin are required.' }, { status: 400 })
  }

  const rateLimitKey = `${slug}:${studentId}`
  const rateCheck = checkRateLimit(rateLimitKey)
  if (rateCheck.blocked) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${rateCheck.minutesLeft} minute${rateCheck.minutesLeft !== 1 ? 's' : ''}.` },
      { status: 429 }
    )
  }

  // Resolve tenant from slug
  const tenant = await prisma.tenant.findFirst({
    where: { slug },
    select: { id: true, name: true, logoUrl: true },
  })
  if (!tenant) {
    return NextResponse.json({ error: 'School not found.' }, { status: 404 })
  }

  // Look up student profile by human-readable studentId (e.g. "STU/2024/001")
  const profile = await (prisma as any).studentProfile.findFirst({
    where: { tenantId: tenant.id, studentId },
    select: {
      studentId: true,
      level:     true,
      cgpa:      true,
      user: {
        select: {
          id:        true,
          firstName: true,
          lastName:  true,
          avatarUrl: true,
          pinHash:   true,
          status:    true,
        },
      },
      program: {
        select: { name: true, code: true },
      },
    },
  })

  if (!profile || !profile.user.pinHash) {
    // Always return same generic error — don't reveal if student exists
    recordFailure(rateLimitKey)
    return NextResponse.json({ error: 'Invalid Student ID or PIN.' }, { status: 401 })
  }

  if (profile.user.status === 'SUSPENDED' || profile.user.status === 'INACTIVE') {
    return NextResponse.json({ error: 'Account is not active. Contact the admin office.' }, { status: 403 })
  }

  const pinMatch = await bcrypt.compare(String(pin), profile.user.pinHash)
  if (!pinMatch) {
    recordFailure(rateLimitKey)
    return NextResponse.json({ error: 'Invalid Student ID or PIN.' }, { status: 401 })
  }

  // PIN correct — clear failures
  clearFailures(rateLimitKey)

  // Fetch a summary of outstanding fees
  const invoices = await (prisma as any).invoice.findMany({
    where: { tenantId: tenant.id, studentId: profile.user.id, status: { in: ['UNPAID', 'PARTIAL'] } },
    select: { totalAmount: true, paidAmount: true },
  })
  const outstandingBalance = invoices.reduce(
    (sum: number, inv: { totalAmount: number; paidAmount: number }) =>
      sum + (inv.totalAmount - inv.paidAmount),
    0
  )

  // Fetch last 5 published grades
  const grades = await (prisma as any).grade.findMany({
    where: { tenantId: tenant.id, studentId: profile.user.id, isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      letterGrade:    true,
      totalScore:     true,
      courseOffering: { select: { course: { select: { title: true, code: true } } } },
    },
  })

  return NextResponse.json({
    school: { name: tenant.name, logoUrl: tenant.logoUrl },
    student: {
      studentId:  profile.studentId,
      firstName:  profile.user.firstName,
      lastName:   profile.user.lastName,
      avatarUrl:  profile.user.avatarUrl,
      program:    profile.program?.name ?? null,
      level:      profile.level,
      cgpa:       profile.cgpa,
    },
    outstandingBalance,
    recentGrades: grades.map((g: any) => ({
      courseCode:  g.courseOffering?.course?.code,
      courseTitle: g.courseOffering?.course?.title,
      score:       g.totalScore,
      grade:       g.letterGrade,
    })),
  })
}
