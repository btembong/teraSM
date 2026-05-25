import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SubmissionsClient } from './SubmissionsClient'

export default async function LmsSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const { assignment: assignmentFilter, status: statusFilter } = await searchParams

  const submissions = await prisma.submission.findMany({
    where: {
      tenantId,
      ...(assignmentFilter ? { assignmentId: assignmentFilter } : {}),
      ...(statusFilter ? { status: statusFilter as any } : { status: { in: ['SUBMITTED', 'GRADED', 'RETURNED', 'LATE'] } }),
    },
    include: {
      assignment: {
        include: { courseOffering: { include: { course: true } } },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  // Fetch student names
  const studentIds = [...new Set(submissions.map(s => s.studentId))]
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const studentMap = Object.fromEntries(students.map(u => [u.id, u]))

  // Assignment list for filter dropdown
  const assignments = await prisma.assignment.findMany({
    where: { tenantId },
    include: { courseOffering: { include: { course: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    submitted:  submissions.filter(s => s.status === 'SUBMITTED').length,
    graded:     submissions.filter(s => s.status === 'GRADED').length,
    late:       submissions.filter(s => s.status === 'LATE').length,
    returned:   submissions.filter(s => s.status === 'RETURNED').length,
  }

  return (
    <SubmissionsClient
      submissions={submissions.map(s => ({
        ...s,
        submittedAt:  s.submittedAt?.toISOString() ?? null,
        gradedAt:     s.gradedAt?.toISOString() ?? null,
        createdAt:    s.createdAt.toISOString(),
        updatedAt:    s.updatedAt.toISOString(),
        assignment: {
          ...s.assignment,
          dueDate:      s.assignment.dueDate.toISOString(),
          publishedAt:  s.assignment.publishedAt?.toISOString() ?? null,
          createdAt:    s.assignment.createdAt.toISOString(),
          updatedAt:    s.assignment.updatedAt.toISOString(),
        },
      }))}
      studentMap={studentMap}
      assignments={assignments.map(a => ({
        id: a.id,
        title: a.title,
        courseCode: a.courseOffering.course.code,
        courseTitle: a.courseOffering.course.title,
      }))}
      stats={stats}
      activeAssignment={assignmentFilter ?? null}
      activeStatus={statusFilter ?? null}
    />
  )
}
