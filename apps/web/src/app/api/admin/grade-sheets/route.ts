/**
 * GET /api/admin/grade-sheets
 *   Returns all course offerings that have at least one SUBMITTED grade,
 *   grouped with counts and submitter info for the admin review panel.
 *
 * POST /api/admin/grade-sheets
 *   body: { courseOfferingId, action: 'publish' | 'reject' }
 *   publish → SUBMITTED grades become PUBLISHED + publishedAt set + CGPA recalculated
 *   reject  → SUBMITTED grades reverted to DRAFT (lecturer must re-enter)
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { calculateCGPA } from '@/lib/grading'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  // Find all offerings that have SUBMITTED grades
  const submittedGrades = await prisma.grade.findMany({
    where: { tenantId, status: 'SUBMITTED' },
    select: {
      courseOfferingId: true,
      submittedAt:      true,
      submittedById:    true,
    },
    distinct: ['courseOfferingId'],
  })

  if (submittedGrades.length === 0) return NextResponse.json([])

  const offeringIds   = submittedGrades.map(g => g.courseOfferingId)
  const submitterIds  = [...new Set(submittedGrades.map(g => g.submittedById).filter(Boolean))] as string[]

  const [offerings, submitters, counts] = await Promise.all([
    prisma.courseOffering.findMany({
      where: { id: { in: offeringIds }, tenantId },
      include: {
        course:   { select: { code: true, title: true, creditHours: true } },
        semester: { include: { academicYear: { select: { name: true, gradeBoundaries: true, passMark: true } } } },
      },
    }),
    submitterIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: submitterIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [],
    prisma.grade.groupBy({
      by: ['courseOfferingId'],
      where: { tenantId, courseOfferingId: { in: offeringIds }, status: 'SUBMITTED' },
      _count: { id: true },
    }),
  ])

  const submitterMap = Object.fromEntries(submitters.map(u => [u.id, u]))
  const countMap     = Object.fromEntries(counts.map(c => [c.courseOfferingId, c._count.id]))
  const submittedMap = Object.fromEntries(submittedGrades.map(g => [g.courseOfferingId, g]))

  const sheets = offerings.map(o => {
    const sg = submittedMap[o.id]
    const submitter = sg?.submittedById ? submitterMap[sg.submittedById] : null
    return {
      offeringId:    o.id,
      course:        o.course,
      semester:      o.semester.name,
      academicYear:  o.semester.academicYear.name,
      submittedAt:   sg?.submittedAt ?? null,
      submittedBy:   submitter
        ? `${submitter.firstName ?? ''} ${submitter.lastName ?? ''}`.trim() || submitter.email
        : 'Unknown',
      studentCount:  countMap[o.id] ?? 0,
    }
  })

  return NextResponse.json(sheets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { courseOfferingId, action } = body
  if (!courseOfferingId || !['publish', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'courseOfferingId and action (publish|reject) required' }, { status: 400 })
  }

  if (action === 'reject') {
    await prisma.grade.updateMany({
      where: { tenantId, courseOfferingId, status: 'SUBMITTED' },
      data:  { status: 'DRAFT', submittedAt: null, submittedById: null },
    })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  // PUBLISH: set publishedAt and update StudentProfile CGPA
  const now = new Date()
  await prisma.grade.updateMany({
    where: { tenantId, courseOfferingId, status: 'SUBMITTED' },
    data:  { status: 'PUBLISHED', publishedAt: now },
  })

  // Recalculate CGPA for all affected students
  const publishedGrades = await prisma.grade.findMany({
    where: { tenantId, courseOfferingId, status: 'PUBLISHED' },
    select: { studentId: true },
  })
  const studentIds = [...new Set(publishedGrades.map(g => g.studentId))]

  for (const studentId of studentIds) {
    const allGrades = await prisma.grade.findMany({
      where: { tenantId, studentId, status: 'PUBLISHED' },
      include: { courseOffering: { include: { course: { select: { creditHours: true } } } } },
    })
    const gradeData = allGrades.map(g => ({
      gradePoint:  g.gradePoint ?? 0,
      creditHours: g.courseOffering.course.creditHours,
    }))
    const { cgpa, totalCredits } = calculateCGPA(gradeData)

    await prisma.studentProfile.updateMany({
      where: { userId: studentId, tenantId },
      data:  { cgpa, totalCredits },
    })
  }

  return NextResponse.json({ ok: true, action: 'published', studentsUpdated: studentIds.length })
}
