/**
 * GET  /api/staff/academic-grades?courseOfferingId=xxx
 *   → list all students enrolled in the offering + their current Grade record
 *
 * POST /api/staff/academic-grades
 *   body: { courseOfferingId, studentId, caScore?, examScore? }
 *   → upsert Grade, compute totalScore / letterGrade / gradePoint from academic year boundaries
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { scoreToLetter, letterToGradePoint } from '@/lib/grading'
import type { GradeBoundary } from '@/lib/grading'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'Missing courseOfferingId' }, { status: 400 })

  // Fetch offering → semester → academic year (for grading boundaries)
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    include: {
      course: { select: { id: true, code: true, title: true, creditHours: true } },
      semester: {
        include: { academicYear: { select: { gradingScale: true, passMark: true, gradeBoundaries: true } } },
      },
    },
  })
  if (!offering) return NextResponse.json({ error: 'Offering not found' }, { status: 404 })

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, courseOfferingId, status: 'ENROLLED' },
    select: { studentId: true },
  })
  const studentIds = enrollments.map(e => e.studentId)

  const [students, grades] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.grade.findMany({
      where: { tenantId, courseOfferingId, studentId: { in: studentIds } },
    }),
  ])

  const gradeMap = Object.fromEntries(grades.map(g => [g.studentId, g]))

  return NextResponse.json({
    offering: {
      id: offering.id,
      course: offering.course,
      gradingScale: offering.semester.academicYear.gradingScale,
      passMark:     offering.semester.academicYear.passMark,
      gradeBoundaries: offering.semester.academicYear.gradeBoundaries,
    },
    students: students.map(s => ({
      ...s,
      grade: gradeMap[s.id] ?? null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { courseOfferingId, studentId, caScore, examScore } = body

  if (!courseOfferingId || !studentId) {
    return NextResponse.json({ error: 'courseOfferingId and studentId required' }, { status: 400 })
  }

  // Validate offering exists and belongs to tenant
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    include: {
      semester: {
        include: { academicYear: { select: { gradingScale: true, passMark: true, gradeBoundaries: true } } },
      },
    },
  })
  if (!offering) return NextResponse.json({ error: 'Offering not found' }, { status: 404 })

  // Compute derived fields
  const ca   = typeof caScore   === 'number' ? caScore   : null
  const exam = typeof examScore === 'number' ? examScore : null
  const total = ca !== null && exam !== null ? ca + exam
              : ca !== null ? ca
              : exam !== null ? exam
              : null

  const boundaries = offering.semester.academicYear.gradeBoundaries as GradeBoundary[] | null

  let letterGrade: string | null = null
  let gradePoint:  number | null = null
  let remark:      string | null = null

  if (total !== null) {
    letterGrade = scoreToLetter(total, boundaries)
    gradePoint  = letterToGradePoint(letterGrade)
    remark = gradePoint >= (offering.semester.academicYear.passMark / 25) ? 'PASS' : 'FAIL'
    // passMark is a percentage; gradePoint >= 1.0 = D = ~60% minimum passing
    remark = gradePoint >= 1.0 ? 'PASS' : 'FAIL'
  }

  const grade = await prisma.grade.upsert({
    where: {
      tenantId_studentId_courseOfferingId: { tenantId, studentId, courseOfferingId },
    },
    create: {
      tenantId,
      studentId,
      courseOfferingId,
      caScore:     ca,
      examScore:   exam,
      totalScore:  total,
      letterGrade,
      gradePoint,
      remark,
    },
    update: {
      caScore:     ca,
      examScore:   exam,
      totalScore:  total,
      letterGrade,
      gradePoint,
      remark,
      // Clear publishedAt if grade is being edited after publishing
      publishedAt: null,
    },
  })

  return NextResponse.json(grade)
}
