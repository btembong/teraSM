import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      phone: true,
      createdAt: true,
      tenant: {
        select: { name: true, logoUrl: true },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get the student's most recent active enrollment to derive department/program/year
  const enrollment = await prisma.enrollment.findFirst({
    where: { tenantId: session.user.tenantId, studentId: session.user.id, status: 'ENROLLED' },
    orderBy: { enrolledAt: 'desc' },
    include: {
      courseOffering: {
        include: {
          course: {
            include: { department: { select: { name: true } } },
          },
          semester: {
            include: { academicYear: { select: { name: true } } },
          },
        },
      },
    },
  })

  // Derive a student number: first 3 chars of tenant + year joined + last 5 of user id
  const joinYear = new Date(user.createdAt).getFullYear()
  const tenantPrefix = (user.tenant.name ?? 'SCH').slice(0, 3).toUpperCase()
  const idSuffix = user.id.slice(-5).toUpperCase()
  const studentNumber = `${tenantPrefix}-${joinYear}-${idSuffix}`

  // Valid until end of current academic year
  const now = new Date()
  const validYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
  const validUntil = `August ${validYear}`

  // Derive year of study from enrolment year vs current year
  const yearOfStudy = enrollment
    ? Math.min(Math.ceil((now.getFullYear() - joinYear + 1)), 6)
    : null

  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    tenantName: user.tenant.name,
    tenantLogoUrl: user.tenant.logoUrl,
    department: enrollment?.courseOffering.course.department?.name ?? null,
    program: enrollment?.courseOffering.course.title ?? null,
    year: yearOfStudy,
    studentNumber,
    validUntil,
  })
}
