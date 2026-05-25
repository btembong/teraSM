import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const [all, byStatus, byProgram, recent] = await Promise.all([
    (prisma as any).admissionApplication.count({ where: { tenantId } }),
    (prisma as any).admissionApplication.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),
    (prisma as any).admissionApplication.groupBy({
      by: ['programOfInterest'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    (prisma as any).admissionApplication.findMany({
      where: { tenantId },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
  ])

  // Build status map
  const statusMap: Record<string, number> = {}
  for (const row of byStatus) statusMap[row.status] = row._count.id

  // Monthly breakdown (last 6 months)
  const now = new Date()
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      count: recent.filter((r: any) => {
        const rd = new Date(r.createdAt)
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
      }).length,
    }
  })

  const offered   = (statusMap['OFFERED']   ?? 0) + (statusMap['ACCEPTED'] ?? 0) + (statusMap['WAITLISTED'] ?? 0)
  const accepted  = statusMap['ACCEPTED'] ?? 0
  const rejected  = statusMap['REJECTED'] ?? 0

  return NextResponse.json({
    total:           all,
    submitted:       statusMap['SUBMITTED']    ?? 0,
    docsReview:      statusMap['DOCS_REVIEW']  ?? 0,
    reviewing:       statusMap['REVIEWING']    ?? 0,
    interview:       statusMap['INTERVIEW']    ?? 0,
    docsVerified:    statusMap['DOCS_VERIFIED'] ?? 0,
    offered:         statusMap['OFFERED']      ?? 0,
    waitlisted:      statusMap['WAITLISTED']   ?? 0,
    accepted,
    rejected,
    withdrawn:       statusMap['WITHDRAWN']    ?? 0,
    acceptanceRate:  offered > 0 ? Math.round((accepted / offered) * 100) : 0,
    conversionRate:  all > 0 ? Math.round((accepted / all) * 100) : 0,
    byProgram:       byProgram.map((r: any) => ({
      program: r.programOfInterest ?? 'Unspecified',
      count:   r._count.id,
    })),
    monthly,
  })
}
