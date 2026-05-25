/**
 * GET  /api/staff/resit-grades?courseOfferingId=xxx
 *   Returns all PENDING/SUBMITTED resit attempts for this offering with student info.
 *
 * POST /api/staff/resit-grades
 *   body: { resitId, examScore }
 *   Saves resit exam score, computes total, applies grade cap, saves result.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { scoreToLetter, letterToGradePoint } from '@/lib/grading'
import type { GradeBoundary } from '@/lib/grading'

// Grade letters ordered worst → best so we can find the cap index
const GRADE_ORDER = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+']

function applyGradeCap(letter: string, capGrade: string): string {
  const idx    = GRADE_ORDER.indexOf(letter)
  const capIdx = GRADE_ORDER.indexOf(capGrade)
  if (idx === -1 || capIdx === -1) return letter
  // If earned grade is better than cap, return cap
  return idx > capIdx ? capGrade : letter
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'Missing courseOfferingId' }, { status: 400 })

  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    include: {
      course: { select: { code: true, title: true, creditHours: true } },
      semester: {
        include: { academicYear: { select: { gradingScale: true, passMark: true, gradeBoundaries: true } } },
      },
    },
  })
  if (!offering) return NextResponse.json({ error: 'Offering not found' }, { status: 404 })

  const resits = await prisma.resitAttempt.findMany({
    where: { tenantId, courseOfferingId, status: { in: ['PENDING', 'SUBMITTED'] } },
    include: {
      grade: { select: { caScore: true, examScore: true, totalScore: true, letterGrade: true } },
    },
  })

  const studentIds = resits.map(r => r.studentId)
  const students   = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
  const studentMap = Object.fromEntries(students.map(u => [u.id, u]))

  return NextResponse.json({
    offering: {
      id:              offering.id,
      course:          offering.course,
      gradingScale:    offering.semester.academicYear.gradingScale,
      passMark:        offering.semester.academicYear.passMark,
      gradeBoundaries: offering.semester.academicYear.gradeBoundaries,
    },
    resits: resits.map(r => ({
      resitId:       r.id,
      studentId:     r.studentId,
      student:       studentMap[r.studentId] ?? null,
      caScore:       r.caScore,        // carried over from original
      examScore:     r.examScore,
      totalScore:    r.totalScore,
      letterGrade:   r.letterGrade,
      gradePoint:    r.gradePoint,
      remark:        r.remark,
      isCapped:      r.isCapped,
      capGrade:      r.capGrade,
      status:        r.status,
      originalGrade: r.grade.letterGrade,
      originalTotal: r.grade.totalScore,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { resitId, examScore } = body
  if (!resitId || typeof examScore !== 'number') {
    return NextResponse.json({ error: 'resitId and examScore required' }, { status: 400 })
  }

  const resit = await prisma.resitAttempt.findFirst({
    where: { id: resitId, tenantId },
    include: {
      grade: {
        include: {
          courseOffering: {
            include: {
              semester: {
                include: { academicYear: { select: { gradeBoundaries: true, passMark: true } } },
              },
            },
          },
        },
      },
    },
  })
  if (!resit) return NextResponse.json({ error: 'Resit attempt not found' }, { status: 404 })
  if (resit.status === 'PUBLISHED') return NextResponse.json({ error: 'Already published' }, { status: 400 })

  const boundaries  = resit.grade.courseOffering.semester.academicYear.gradeBoundaries as GradeBoundary[] | null
  const caScore     = resit.caScore ?? 0
  const total       = caScore + examScore
  let letterGrade   = scoreToLetter(total, boundaries)

  // Apply cap if institution policy
  if (resit.isCapped) {
    letterGrade = applyGradeCap(letterGrade, resit.capGrade)
  }

  const gradePoint = letterToGradePoint(letterGrade)
  const remark     = gradePoint >= 1.0 ? 'PASS' : 'FAIL'

  const updated = await prisma.resitAttempt.update({
    where: { id: resitId },
    data: {
      examScore,
      totalScore: total,
      letterGrade,
      gradePoint,
      remark,
      status: 'PENDING', // stays PENDING until submitted
    },
  })

  return NextResponse.json(updated)
}
