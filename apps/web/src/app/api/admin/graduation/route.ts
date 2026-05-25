/**
 * GET  /api/admin/graduation
 *   Returns all graduation applications with student details.
 *
 * POST /api/admin/graduation
 *   body: { applicationId, action: 'approve' | 'reject' | 'graduate' | 'review', rejectionReason?, graduationDate?, gownSize? }
 *   Transitions the application status and updates StudentProfile on graduation.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const applications = await (prisma as any).graduationApplication.findMany({
    where: { tenantId },
    include: {
      studentProfile: {
        include: {
          program: { select: { name: true, code: true, requiredCredits: true } },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  })

  const studentIds  = applications.map((a: any) => a.studentId)
  const reviewerIds = applications.map((a: any) => a.reviewedById).filter(Boolean)

  const [students, reviewers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    reviewerIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: reviewerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [],
  ])

  const studentMap  = Object.fromEntries(students.map((u: any) => [u.id, u]))
  const reviewerMap = Object.fromEntries((reviewers as any[]).map((u: any) => [u.id, u]))

  const result = applications.map((a: any) => {
    const student  = studentMap[a.studentId]
    const reviewer = a.reviewedById ? reviewerMap[a.reviewedById] : null
    return {
      id:             a.id,
      status:         a.status,
      appliedAt:      a.appliedAt,
      reviewedAt:     a.reviewedAt,
      graduationDate: a.graduationDate,
      gownSize:       a.gownSize,
      notes:          a.notes,
      rejectionReason: a.rejectionReason,
      student: student ? {
        id:    student.id,
        name:  [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email,
        email: student.email,
      } : null,
      profile: {
        studentId:    a.studentProfile.studentId,
        level:        a.studentProfile.level,
        cgpa:         a.studentProfile.cgpa,
        totalCredits: a.studentProfile.totalCredits,
        graduatedAt:  a.studentProfile.graduatedAt,
        programName:  a.studentProfile.program?.name ?? null,
        programCode:  a.studentProfile.program?.code ?? null,
        requiredCredits: a.studentProfile.program?.requiredCredits ?? 120,
      },
      reviewedBy: reviewer
        ? [reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ')
        : null,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const adminId  = (session.user as any).id

  const body = await req.json()
  const { applicationId, action, rejectionReason, graduationDate, gownSize } = body

  if (!applicationId || !action) {
    return NextResponse.json({ error: 'applicationId and action required' }, { status: 400 })
  }

  const app = await (prisma as any).graduationApplication.findFirst({
    where: { id: applicationId, tenantId },
    include: { studentProfile: true },
  })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const now = new Date()

  switch (action) {
    case 'review':
      await (prisma as any).graduationApplication.update({
        where: { id: applicationId },
        data:  { status: 'UNDER_REVIEW', reviewedById: adminId, reviewedAt: now },
      })
      break

    case 'approve':
      await (prisma as any).graduationApplication.update({
        where: { id: applicationId },
        data: {
          status:         'APPROVED',
          reviewedById:   adminId,
          reviewedAt:     now,
          graduationDate: graduationDate ? new Date(graduationDate) : null,
          gownSize:       gownSize ?? app.gownSize,
          rejectionReason: null,
        },
      })
      break

    case 'reject':
      await (prisma as any).graduationApplication.update({
        where: { id: applicationId },
        data: {
          status:          'REJECTED',
          reviewedById:    adminId,
          reviewedAt:      now,
          rejectionReason: rejectionReason ?? null,
        },
      })
      break

    case 'graduate':
      // Final step — mark as officially graduated
      await Promise.all([
        (prisma as any).graduationApplication.update({
          where: { id: applicationId },
          data:  { status: 'GRADUATED', reviewedAt: now },
        }),
        prisma.studentProfile.update({
          where: { id: app.studentProfileId },
          data:  { graduatedAt: now },
        }),
      ])
      break

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, action })
}
