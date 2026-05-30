import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/transcript-token'

// GET /api/public/verify/[code] — public document verification (no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const request = await (prisma as any).transcriptRequest.findUnique({
    where: { verificationCode: code },
  }) as {
    id: string; studentId: string; tenantId: string; type: string; status: string;
    issuedAt: Date; verificationCode: string
  } | null

  if (!request) {
    return NextResponse.json({ valid: false, reason: 'Document not found' }, { status: 404 })
  }

  // Verify HMAC signature
  const signatureValid = verifyCode(code, request.id, request.studentId)
  if (!signatureValid) {
    return NextResponse.json({ valid: false, reason: 'Invalid signature' }, { status: 400 })
  }

  // Fetch student + tenant info for display
  const [student, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: request.studentId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.tenant.findUnique({
      where: { id: request.tenantId },
      select: { name: true, logoUrl: true },
    }),
  ])

  // Fetch published grades for CGPA
  const grades = await prisma.grade.findMany({
    where: { tenantId: request.tenantId, studentId: request.studentId, publishedAt: { not: null } },
    include: { courseOffering: { include: { course: { select: { creditHours: true } } } } },
  })
  let pts = 0, creds = 0
  for (const g of grades) {
    if (g.gradePoint == null) continue
    pts   += g.gradePoint * g.courseOffering.course.creditHours
    creds += g.courseOffering.course.creditHours
  }
  const cgpa = creds > 0 ? (pts / creds).toFixed(2) : '0.00'

  // Mark as downloaded (first scan)
  if (request.status === 'READY') {
    await (prisma as any).transcriptRequest.update({
      where: { id: request.id },
      data:  { status: 'DOWNLOADED', downloadedAt: new Date() },
    })
  }

  return NextResponse.json({
    valid:      true,
    type:       request.type,
    issuedAt:   request.issuedAt,
    docRef:     `TR-${request.id.slice(-10).toUpperCase()}`,
    student: {
      name:  student ? `${student.firstName} ${student.lastName}` : 'Unknown',
      email: student?.email ?? '',
    },
    institution: {
      name:    tenant?.name    ?? '',
      logoUrl: tenant?.logoUrl ?? null,
    },
    summary: { cgpa, totalCredits: creds, courseCount: grades.length },
  })
}
