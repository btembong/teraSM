/**
 * GET /api/admin/students/promotion-preview?academicYearId=xxx
 *
 * Returns all active students grouped by their current level,
 * with their credit counts and CGPA so the admin can decide who to promote.
 *
 * Eligible = CGPA > 0 and earned enough credits for the level
 *   Level 100 → 200 : need ≥ 30 credits
 *   Level 200 → 300 : need ≥ 60 credits
 *   Level 300 → 400 : need ≥ 90 credits
 *   Level 400+       : final year, no promotion (graduation)
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const CREDIT_THRESHOLDS: Record<number, number> = {
  100: 30,
  200: 60,
  300: 90,
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  // All active students with their profiles
  const profiles = await prisma.studentProfile.findMany({
    where: { tenantId },
    include: {
      program: { select: { name: true, code: true, durationYears: true, requiredCredits: true } },
    },
  })

  const userIds = profiles.map(p => p.userId)

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, tenantId, role: 'STUDENT', status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const result = profiles
    .filter(p => userMap[p.userId]) // only active students
    .map(p => {
      const user       = userMap[p.userId]
      const threshold  = CREDIT_THRESHOLDS[p.level]
      const maxLevel   = p.program ? p.program.durationYears * 100 : 400
      const eligible   = threshold !== undefined
        && p.totalCredits >= threshold
        && p.cgpa > 0
        && p.level < maxLevel

      return {
        userId:        p.userId,
        studentId:     p.studentId,
        name:          [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        email:         user.email,
        level:         p.level,
        cgpa:          p.cgpa,
        totalCredits:  p.totalCredits,
        programName:   p.program?.name ?? null,
        programCode:   p.program?.code ?? null,
        requiredCredits: threshold ?? null,
        eligible,
        atFinalYear:   threshold === undefined,
      }
    })

  // Group by level
  const byLevel: Record<number, typeof result> = {}
  for (const s of result) {
    if (!byLevel[s.level]) byLevel[s.level] = []
    byLevel[s.level].push(s)
  }

  // Sort each level: eligible first, then by name
  for (const level of Object.keys(byLevel)) {
    byLevel[Number(level)].sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  return NextResponse.json({
    thresholds: CREDIT_THRESHOLDS,
    byLevel,
    totalStudents: result.length,
    totalEligible: result.filter(s => s.eligible).length,
  })
}
