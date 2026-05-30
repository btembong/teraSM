import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { generateVerificationCode } from '@/lib/transcript-token'
import { TranscriptDocument, type TranscriptData, type TranscriptGrade } from '@/lib/pdf/transcript'
import { createElement } from 'react'
import { uploadFile } from '@/lib/r2'

const ADMIN_ROLES = ['TENANT_ADMIN', 'REGISTRAR']

// GET /api/admin/transcript-requests?studentId=xxx — list requests (all or per student)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes((session.user as any).role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId  = (session.user as any).tenantId
  const studentId = req.nextUrl.searchParams.get('studentId') ?? undefined

  const requests = await (prisma as any).transcriptRequest.findMany({
    where: { tenantId, ...(studentId ? { studentId } : {}) },
    orderBy: { issuedAt: 'desc' },
    take: 100,
  })

  // Enrich with student names
  const ids = [...new Set(requests.map((r: any) => r.studentId))] as string[]
  const users = ids.length > 0
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true, email: true } })
    : []
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return NextResponse.json(requests.map((r: any) => ({ ...r, student: userMap[r.studentId] ?? null })))
}

// POST /api/admin/transcript-requests — admin generates official transcript for a student
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes((session.user as any).role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId
  const adminId  = (session.user as any).id

  const { studentId, purpose } = await req.json()
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  // Fetch student + tenant + grades
  const [student, tenant, grades] = await Promise.all([
    prisma.user.findFirst({ where: { id: studentId, tenantId }, select: { firstName: true, lastName: true, email: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, address: true, email: true, logoUrl: true } }),
    prisma.grade.findMany({
      where: { tenantId, studentId, publishedAt: { not: null } },
      include: {
        courseOffering: {
          include: {
            course:   { include: { department: { select: { name: true } } } },
            semester: { include: { academicYear: { select: { name: true } } } },
          },
        },
      },
      orderBy: { courseOffering: { semester: { academicYear: { startDate: 'asc' } } } },
    }),
  ])

  if (!student || !tenant) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Build grade list + CGPA
  const gradeList: TranscriptGrade[] = grades.map(g => ({
    courseCode:   g.courseOffering.course.code,
    courseTitle:  g.courseOffering.course.title,
    department:   g.courseOffering.course.department.name,
    creditHours:  g.courseOffering.course.creditHours,
    totalScore:   g.totalScore,
    letterGrade:  g.letterGrade,
    gradePoint:   g.gradePoint,
    semesterName: g.courseOffering.semester.name,
    yearName:     g.courseOffering.semester.academicYear.name,
  }))
  let pts = 0, creds = 0
  for (const g of gradeList) { if (g.gradePoint != null) { pts += g.gradePoint * g.creditHours; creds += g.creditHours } }
  const cgpa = creds > 0 ? pts / creds : 0

  // Create request record first (to get an id)
  const tempCode = generateVerificationCode(`tmp-${studentId}`, studentId)
  const request  = await (prisma as any).transcriptRequest.create({
    data: {
      tenantId, studentId, requestedById: adminId,
      type: 'OFFICIAL', status: 'PENDING',
      verificationCode: tempCode,
      purpose: purpose ?? null,
    },
  })

  // Re-sign with real id
  const verificationCode = generateVerificationCode(request.id, studentId)
  await (prisma as any).transcriptRequest.update({ where: { id: request.id }, data: { verificationCode } })

  const docRef   = `TR-${request.id.slice(-10).toUpperCase()}`
  const issued   = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const baseUrl  = process.env.NEXTAUTH_URL ?? 'https://terasms.com'
  const verifyUrl = `${baseUrl}/verify/${verificationCode}`

  // Generate QR
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 160, margin: 1,
    color: { dark: '#1e3a8a', light: '#ffffff' },
  })

  const pdfData: TranscriptData = {
    schoolName: tenant.name, schoolAddress: tenant.address ?? '', schoolEmail: tenant.email,
    logoUrl: tenant.logoUrl ?? undefined,
    signatoryName: 'Registrar', signatoryTitle: 'Academic Affairs Office',
    firstName: student.firstName, lastName: student.lastName, email: student.email,
    type: 'OFFICIAL', docRef, issuedAt: issued,
    verificationCode, verifyUrl,
    grades: gradeList, cgpa, totalCredits: creds,
    qrDataUrl,
  }

  const buffer = await renderToBuffer(createElement(TranscriptDocument, { data: pdfData }))

  // Upload to R2
  const key     = `transcripts/${tenantId}/${studentId}/${request.id}.pdf`
  const pdfUrl  = await uploadFile({ key, body: buffer, contentType: 'application/pdf' })

  // Mark ready
  const updated = await (prisma as any).transcriptRequest.update({
    where: { id: request.id },
    data:  { status: 'READY', generatedAt: new Date(), pdfUrl: pdfUrl ?? null, verificationCode },
  })

  return NextResponse.json({ ...updated, verifyUrl, docRef }, { status: 201 })
}
