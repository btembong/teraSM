/**
 * POST /api/staff/academic-grades/publish?courseOfferingId=xxx
 *
 * 1. Sets publishedAt = now() on all Grade records for this offering
 * 2. Re-calculates CGPA + totalCredits for every affected student
 *    by summing ALL their published grades across all semesters.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { calculateCGPA, isPassing } from '@/lib/grading'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'Missing courseOfferingId' }, { status: 400 })

  // Verify offering belongs to tenant
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    include: { course: { select: { creditHours: true } } },
  })
  if (!offering) return NextResponse.json({ error: 'Offering not found' }, { status: 404 })

  const now = new Date()

  // Publish all unpublished grades for this offering
  const published = await prisma.grade.updateMany({
    where: { tenantId, courseOfferingId, publishedAt: null, gradePoint: { not: null } },
    data: { publishedAt: now },
  })

  // Collect unique students that have grades in this offering
  const affectedGrades = await prisma.grade.findMany({
    where: { tenantId, courseOfferingId },
    select: { studentId: true },
  })
  const studentIds = [...new Set(affectedGrades.map(g => g.studentId))]

  // Recalculate CGPA for each affected student
  const updates: Array<{ studentId: string; cgpa: number; totalCredits: number }> = []

  for (const studentId of studentIds) {
    // All published grades for this student across the tenant
    const allGrades = await prisma.grade.findMany({
      where: { tenantId, studentId, publishedAt: { not: null }, gradePoint: { not: null } },
      include: {
        courseOffering: {
          include: { course: { select: { creditHours: true } } },
        },
      },
    })

    const gradeData = allGrades.map(g => ({
      gradePoint: g.gradePoint,
      creditHours: g.courseOffering.course.creditHours,
    }))

    const { cgpa, totalCredits } = calculateCGPA(gradeData)
    updates.push({ studentId, cgpa, totalCredits })

    // Update StudentProfile (upsert because profile may not exist yet)
    await prisma.studentProfile.updateMany({
      where: { tenantId, userId: studentId },
      data: { cgpa, totalCredits },
    })
  }

  return NextResponse.json({
    published: published.count,
    studentsUpdated: updates.length,
    updates,
  })
}
