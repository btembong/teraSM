import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId   = session.user.id
  const tenantId = (session.user as any).tenantId

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return NextResponse.json({ semester: null, profile: null, enrolled: [], available: [] })

  // ── Student profile (programme + level) ────────────────────────────────────
  const profile = await (prisma as any).studentProfile.findUnique({
    where: { userId },
    select: { programId: true, level: true, program: { select: { name: true, code: true } } },
  }) as { programId: string | null; level: number | null; program: { name: string; code: string } | null } | null

  // ── Programme curriculum: which courses are Required/Elective per level ────
  const programCourses: { courseId: string; level: number; isRequired: boolean }[] = profile?.programId
    ? await (prisma as any).programCourse.findMany({
        where: { programId: profile.programId },
        select: { courseId: true, level: true, isRequired: true },
      })
    : []
  const programCourseMap = new Map(programCourses.map(pc => [pc.courseId, pc]))

  // ── Courses the student has completed (for prerequisite gate checks) ────────
  // 1. Published grades with passing score
  const passedGrades = await (prisma as any).grade.findMany({
    where: { tenantId, studentId: userId, isPublished: true, totalScore: { gte: 50 } },
    select: { courseOffering: { select: { course: { select: { code: true } } } } },
  }).catch(() => []) as any[]

  // 2. ENROLLED status in any past semester (handles case where grades not yet published)
  const prevEnrollments = await (prisma as any).enrollment.findMany({
    where: {
      tenantId,
      studentId: userId,
      status: 'ENROLLED',
      courseOffering: { semesterId: { not: activeSemester.id } },
    },
    include: { courseOffering: { include: { course: { select: { code: true } } } } },
  }) as any[]

  const completedCodes = new Set<string>([
    ...passedGrades.map((g: any) => g.courseOffering?.course?.code).filter(Boolean),
    ...prevEnrollments.map((e: any) => e.courseOffering?.course?.code).filter(Boolean),
  ])

  // ── Student's current semester enrollments ─────────────────────────────────
  const myEnrollments = await (prisma as any).enrollment.findMany({
    where: {
      tenantId,
      studentId: userId,
      status: { in: ['ENROLLED', 'WAITLISTED', 'PENDING'] },
      courseOffering: { semesterId: activeSemester.id },
    },
    include: {
      courseOffering: {
        include: {
          course: { include: { department: true } },
          teacher: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  })

  const enrolledOfferingIds = new Set(myEnrollments.map(e => e.courseOfferingId))

  // ── All available offerings not yet enrolled in ────────────────────────────
  const allOfferings = await (prisma as any).courseOffering.findMany({
    where: {
      tenantId,
      semesterId: activeSemester.id,
      id: { notIn: [...enrolledOfferingIds] },
    },
    include: {
      course: { include: { department: true } },
      teacher: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ course: { level: 'asc' } }, { course: { code: 'asc' } }],
  })

  // ── Shape offering into API response ───────────────────────────────────────
  function toOffering(o: any, enrollmentStatus?: string) {
    const pc = programCourseMap.get(o.course.id)
    const prerequisites: string[] = o.course.prerequisites ?? []
    const missingPrereqs = prerequisites.filter(code => !completedCodes.has(code))

    return {
      id:               o.id,
      courseId:         o.course.id,
      courseCode:       o.course.code,
      courseTitle:      o.course.title,
      creditHours:      o.course.creditHours,
      level:            o.course.level,
      department:       o.course.department.name,
      departmentCode:   o.course.department.code,
      teacherName:      o.teacher
        ? `${o.teacher.firstName} ${o.teacher.lastName}`.trim() || o.teacher.email
        : '—',
      maxStudents:      o.maxStudents,
      room:             o.room,
      enrolled:         o._count.enrollments,
      // Programme context
      inMyProgramme:    !!pc,
      isRequired:       pc ? pc.isRequired : null,
      programLevel:     pc ? pc.level : null,
      // Prerequisite gate
      prerequisites,
      prerequisitesMet: missingPrereqs.length === 0,
      missingPrereqs,
      ...(enrollmentStatus ? { enrollmentStatus } : {}),
    }
  }

  return NextResponse.json({
    semester: {
      id:           activeSemester.id,
      name:         activeSemester.name,
      academicYear: (activeSemester as any).academicYear.name,
    },
    profile: profile ? {
      programName: profile.program?.name ?? null,
      programCode: profile.program?.code ?? null,
      level:       profile.level,
    } : null,
    enrolled:  myEnrollments.map(e => toOffering(e.courseOffering, e.status)),
    available: allOfferings.map(o => toOffering(o)),
  })
}
