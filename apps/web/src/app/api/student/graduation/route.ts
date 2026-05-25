/**
 * GET  /api/student/graduation
 *   Returns the student's eligibility status + their application (if any).
 *
 * POST /api/student/graduation
 *   body: { gownSize?, notes? }
 *   Submits a graduation application (must be eligible first).
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const MIN_CGPA = 1.0          // minimum CGPA to graduate
const MIN_LEVEL = 400         // must be at final year

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  const profile = await prisma.studentProfile.findFirst({
    where: { tenantId, userId },
    include: {
      program: { select: { name: true, requiredCredits: true, durationYears: true } },
      graduationApplication: true,
    },
  })

  if (!profile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

  const requiredCredits = profile.program?.requiredCredits ?? 120
  const maxLevel        = (profile.program?.durationYears ?? 4) * 100

  // Check outstanding fees
  const unpaidCount = await prisma.invoice.count({
    where: {
      tenantId,
      studentId: userId,
      status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
    },
  })

  const checks = {
    level:      { pass: profile.level >= maxLevel,            label: `At final year (Level ${maxLevel})`,                  value: `Level ${profile.level}` },
    credits:    { pass: profile.totalCredits >= requiredCredits, label: `${requiredCredits} credits required`,             value: `${profile.totalCredits} earned` },
    cgpa:       { pass: profile.cgpa >= MIN_CGPA,             label: `CGPA ≥ ${MIN_CGPA}`,                                value: profile.cgpa.toFixed(2) },
    fees:       { pass: unpaidCount === 0,                    label: 'No outstanding fees',                               value: unpaidCount === 0 ? 'Clear' : `${unpaidCount} unpaid invoice(s)` },
  }

  const eligible = Object.values(checks).every(c => c.pass)

  return NextResponse.json({
    eligible,
    checks,
    profile: {
      level:        profile.level,
      cgpa:         profile.cgpa,
      totalCredits: profile.totalCredits,
      graduatedAt:  profile.graduatedAt,
      programName:  profile.program?.name ?? null,
      requiredCredits,
    },
    application: profile.graduationApplication ?? null,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  const body = await req.json()
  const { gownSize, notes } = body

  const profile = await prisma.studentProfile.findFirst({
    where: { tenantId, userId },
    include: {
      program: { select: { requiredCredits: true, durationYears: true } },
      graduationApplication: true,
    },
  })

  if (!profile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  if (profile.graduationApplication) return NextResponse.json({ error: 'Application already submitted' }, { status: 409 })

  const requiredCredits = profile.program?.requiredCredits ?? 120
  const maxLevel        = (profile.program?.durationYears ?? 4) * 100

  if (profile.level < maxLevel) return NextResponse.json({ error: 'Not at final year level' }, { status: 400 })
  if (profile.totalCredits < requiredCredits) return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
  if (profile.cgpa < MIN_CGPA) return NextResponse.json({ error: 'CGPA below minimum' }, { status: 400 })

  const application = await prisma.graduationApplication.create({
    data: {
      tenantId,
      studentId:       userId,
      studentProfileId: profile.id,
      gownSize:        gownSize ?? null,
      notes:           notes ?? null,
      status:          'APPLIED',
    },
  })

  return NextResponse.json(application)
}
