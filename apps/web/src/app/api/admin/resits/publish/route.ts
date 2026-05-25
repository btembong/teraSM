/**
 * POST /api/admin/resits/publish
 * body: { resitIds: string[] }
 *
 * Publishes submitted resit results:
 * - Sets status → PUBLISHED, publishedAt → now
 * - Recalculates StudentProfile CGPA and totalCredits:
 *     For CGPA: use resit gradePoint in place of the original failed grade
 *     For totalCredits: add creditHours if resit PASSED (original failed so credits weren't counted)
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { calculateCGPA } from '@/lib/grading'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { resitIds } = body
  if (!Array.isArray(resitIds) || resitIds.length === 0) {
    return NextResponse.json({ error: 'resitIds array required' }, { status: 400 })
  }

  const now = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any

  const resits = await db.resitAttempt.findMany({
    where: { id: { in: resitIds }, tenantId, status: 'SUBMITTED' },
    include: {
      grade: {
        include: {
          courseOffering: {
            include: {
              course: { select: { creditHours: true } },
            },
          },
        },
      },
    },
  })

  if (resits.length === 0) {
    return NextResponse.json({ error: 'No submitted resit attempts found' }, { status: 404 })
  }

  // Publish each resit
  await db.resitAttempt.updateMany({
    where: { id: { in: resitIds }, tenantId, status: 'SUBMITTED' },
    data:  { status: 'PUBLISHED', publishedAt: now },
  })

  // Recalculate CGPA for affected students
  const affectedStudents: string[] = [...new Set<string>(resits.map((r: any) => r.studentId))]

  for (const studentId of affectedStudents) {
    // All published regular grades for this student
    const regularGrades = await db.grade.findMany({
      where: { tenantId, studentId, status: 'PUBLISHED' },
      include: {
        courseOffering: { include: { course: { select: { creditHours: true } } } },
        resitAttempt: true,
      },
    })

    // Build grade data for CGPA calculation.
    // For each grade: if it has a PUBLISHED resit, use resit gradePoint; otherwise use original.
    const gradeData: { gradePoint: number; creditHours: number }[] = []
    const creditedOfferingIds = new Set<string>()

    for (const g of regularGrades) {
      const creditHours = g.courseOffering.course.creditHours
      const resit       = g.resitAttempt

      if (resit && resit.status === 'PUBLISHED') {
        // Use resit grade point
        gradeData.push({ gradePoint: resit.gradePoint ?? 0, creditHours })
        // Credits: award if resit passed and original failed
        if (resit.remark === 'PASS') {
          creditedOfferingIds.add(g.courseOfferingId)
        }
      } else if (g.remark === 'PASS') {
        // Regular pass — use original grade
        gradeData.push({ gradePoint: g.gradePoint ?? 0, creditHours })
        creditedOfferingIds.add(g.courseOfferingId)
      } else {
        // Failed with no published resit — still include in CGPA (F = 0 GPA points)
        gradeData.push({ gradePoint: g.gradePoint ?? 0, creditHours })
      }
    }

    const { cgpa } = calculateCGPA(gradeData)
    const totalCredits = [...creditedOfferingIds].reduce((sum, offeringId) => {
      const g = regularGrades.find((x: any) => x.courseOfferingId === offeringId)
      return sum + (g?.courseOffering.course.creditHours ?? 0)
    }, 0)

    await prisma.studentProfile.updateMany({
      where: { tenantId, userId: studentId },
      data:  { cgpa, totalCredits },
    })
  }

  return NextResponse.json({ published: resits.length, studentsUpdated: affectedStudents.length })
}
