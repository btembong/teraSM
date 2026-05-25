/**
 * GET  /api/admin/resits
 *   Returns all PUBLISHED grades with remark=FAIL that don't yet have a ResitAttempt,
 *   plus all existing ResitAttempts (any status) for the admin panel.
 *
 * POST /api/admin/resits
 *   body: { gradeIds: string[], isCapped?: boolean, capGrade?: string }
 *   Marks the given failed grades as eligible for resit → creates ResitAttempt records.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const [failedGrades, resitAttempts] = await Promise.all([
    // PUBLISHED fail grades with no resit yet
    prisma.grade.findMany({
      where: {
        tenantId,
        status:  'PUBLISHED',
        remark:  'FAIL',
        resitAttempt: null,
      },
      include: {
        courseOffering: {
          include: {
            course:   { select: { code: true, title: true, creditHours: true } },
            semester: { include: { academicYear: { select: { name: true } } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    // All existing resit attempts
    prisma.resitAttempt.findMany({
      where: { tenantId },
      include: {
        grade: {
          include: {
            courseOffering: {
              include: {
                course:   { select: { code: true, title: true, creditHours: true } },
                semester: { include: { academicYear: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Fetch student names for failed grades
  const allStudentIds = [
    ...failedGrades.map(g => g.studentId),
    ...resitAttempts.map(r => r.studentId),
  ]
  const students = await prisma.user.findMany({
    where: { id: { in: [...new Set(allStudentIds)] } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const studentMap = Object.fromEntries(students.map(u => [u.id, u]))

  const failed = failedGrades.map(g => {
    const u = studentMap[g.studentId]
    return {
      gradeId:         g.id,
      studentId:       g.studentId,
      studentName:     u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : 'Unknown',
      studentEmail:    u?.email ?? '',
      courseCode:      g.courseOffering.course.code,
      courseTitle:     g.courseOffering.course.title,
      creditHours:     g.courseOffering.course.creditHours,
      semester:        g.courseOffering.semester.name,
      academicYear:    g.courseOffering.semester.academicYear.name,
      courseOfferingId: g.courseOfferingId,
      caScore:         g.caScore,
      examScore:       g.examScore,
      totalScore:      g.totalScore,
      letterGrade:     g.letterGrade,
    }
  })

  const resits = resitAttempts.map(r => {
    const u = studentMap[r.studentId]
    return {
      resitId:         r.id,
      gradeId:         r.gradeId,
      studentId:       r.studentId,
      studentName:     u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : 'Unknown',
      studentEmail:    u?.email ?? '',
      courseCode:      r.grade.courseOffering.course.code,
      courseTitle:     r.grade.courseOffering.course.title,
      creditHours:     r.grade.courseOffering.course.creditHours,
      semester:        r.grade.courseOffering.semester.name,
      academicYear:    r.grade.courseOffering.semester.academicYear.name,
      courseOfferingId: r.courseOfferingId,
      originalCA:      r.grade.caScore,
      originalExam:    r.grade.examScore,
      originalTotal:   r.grade.totalScore,
      originalGrade:   r.grade.letterGrade,
      caScore:         r.caScore,
      examScore:       r.examScore,
      totalScore:      r.totalScore,
      letterGrade:     r.letterGrade,
      gradePoint:      r.gradePoint,
      remark:          r.remark,
      isCapped:        r.isCapped,
      capGrade:        r.capGrade,
      status:          r.status,
      submittedAt:     r.submittedAt,
      publishedAt:     r.publishedAt,
    }
  })

  return NextResponse.json({ failed, resits })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { gradeIds, isCapped = true, capGrade = 'C' } = body

  if (!Array.isArray(gradeIds) || gradeIds.length === 0) {
    return NextResponse.json({ error: 'gradeIds array required' }, { status: 400 })
  }

  // Fetch the grades to copy CA scores
  const grades = await prisma.grade.findMany({
    where: { id: { in: gradeIds }, tenantId, remark: 'FAIL', status: 'PUBLISHED' },
  })

  const created = await Promise.all(
    grades.map(g =>
      prisma.resitAttempt.upsert({
        where:  { gradeId: g.id },
        create: {
          tenantId,
          gradeId:          g.id,
          studentId:        g.studentId,
          courseOfferingId: g.courseOfferingId,
          caScore:          g.caScore,   // carry over CA
          isCapped,
          capGrade,
          status: 'PENDING',
        },
        update: {}, // don't overwrite if already exists
      }),
    ),
  )

  return NextResponse.json({ created: created.length })
}
