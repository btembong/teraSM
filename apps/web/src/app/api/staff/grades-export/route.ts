import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'Missing courseOfferingId' }, { status: 400 })

  const [enrollments, assignments, submissions] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseOfferingId, status: 'ENROLLED' },
      select: { studentId: true },
    }),
    prisma.assignment.findMany({
      where: { courseOfferingId },
      orderBy: { dueDate: 'asc' },
      select: { id: true, title: true, maxScore: true },
    }),
    prisma.submission.findMany({
      where: { assignment: { courseOfferingId } },
      select: { studentId: true, assignmentId: true, score: true, status: true },
    }),
  ])

  const studentIds = enrollments.map(e => e.studentId)
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { lastName: 'asc' },
  })
  // Build lookup: submissionMap[studentId][assignmentId] = score
  const subMap: Record<string, Record<string, number | null>> = {}
  submissions.forEach(s => {
    if (!subMap[s.studentId]) subMap[s.studentId] = {}
    subMap[s.studentId][s.assignmentId] = s.score
  })

  // CSV header
  const headers = [
    'Student ID', 'Last Name', 'First Name', 'Email',
    ...assignments.map(a => `${a.title} (/${a.maxScore})`),
    'Total Score', 'Max Possible',
  ]

  const rows = students.map(s => {
    const scores = assignments.map(a => {
      const score = subMap[s.id]?.[a.id]
      return score !== undefined && score !== null ? String(score) : ''
    })
    const totalEarned = assignments.reduce((sum, a) => {
      const score = subMap[s.id]?.[a.id]
      return sum + (score ?? 0)
    }, 0)
    const totalMax = assignments.reduce((sum, a) => sum + a.maxScore, 0)
    return [s.id, s.lastName, s.firstName, s.email, ...scores, String(totalEarned), String(totalMax)]
  })

  const csvLines = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  )

  return new NextResponse(csvLines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="grades-${courseOfferingId}.csv"`,
    },
  })
}
