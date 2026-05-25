import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const today     = new Date()
  const sixMonths = new Date(today.getFullYear(), today.getMonth() - 5, 1)

  // 1. Enrollment counts per month (last 6 months)
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, enrolledAt: { gte: sixMonths } },
    select: { enrolledAt: true },
  })

  const monthLabels: string[] = []
  const monthCounts: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    monthLabels.push(label)
    const count = enrollments.filter(e => {
      const m = new Date(e.enrolledAt)
      return m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth()
    }).length
    monthCounts.push(count)
  }

  // 2. Attendance rate per course (top 10 offerings by attendance records)
  const attendanceRecords = await prisma.attendance.findMany({
    where: { courseOffering: { tenantId } },
    select: { status: true, courseOffering: { select: { id: true, course: { select: { code: true } } } } },
  })

  const courseMap: Record<string, { code: string; total: number; present: number }> = {}
  for (const r of attendanceRecords) {
    const id = r.courseOffering.id
    if (!courseMap[id]) courseMap[id] = { code: r.courseOffering.course.code, total: 0, present: 0 }
    courseMap[id].total++
    if (r.status === 'PRESENT') courseMap[id].present++
  }

  const attendanceByC = Object.values(courseMap)
    .filter(c => c.total >= 5)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(c => ({ code: c.code, rate: Math.round((c.present / c.total) * 100) }))

  // 3. Grade distribution
  const grades = await prisma.grade.findMany({
    where: { courseOffering: { tenantId }, letterGrade: { not: null } },
    select: { letterGrade: true },
  })

  const gradeDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  for (const g of grades) {
    const letter = (g.letterGrade ?? '').charAt(0).toUpperCase()
    if (letter in gradeDist) gradeDist[letter]++
  }

  // 4. Academic standing distribution
  const standings = await prisma.user.groupBy({
    by: ['academicStanding'],
    where: { tenantId, role: 'STUDENT' },
    _count: { id: true },
  })

  const standingDist = standings.map(s => ({
    standing: s.academicStanding ?? 'GOOD_STANDING',
    count: s._count.id,
  }))

  // 5. Monthly registration summary (user signups)
  const signups = await prisma.user.findMany({
    where: { tenantId, createdAt: { gte: sixMonths } },
    select: { createdAt: true, role: true },
  })

  const signupCounts = monthLabels.map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    return signups.filter(u => {
      const m = new Date(u.createdAt)
      return m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth() && u.role === 'STUDENT'
    }).length
  })

  return NextResponse.json({
    enrollment: { labels: monthLabels, counts: monthCounts },
    signups: { labels: monthLabels, counts: signupCounts },
    attendanceByC,
    gradeDist,
    standingDist,
  })
}
