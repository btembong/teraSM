import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    pendingAdmissions,
    activeInvites,
    unpaidInvoices,
    ungradedSubmissions,
    pendingLeave,
    liveNow,
    classesToday,
    activeElections,
    openMaintenance,
  ] = await Promise.all([
    prisma.admissionApplication.count({
      where: { tenantId, status: 'SUBMITTED' },
    }),
    prisma.invite.count({
      where: {
        tenantId,
        useCount: 0,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.invoice.count({
      where: { tenantId, status: { in: ['DRAFT', 'SENT', 'OVERDUE', 'PARTIALLY_PAID'] } },
    }),
    prisma.submission.count({
      where: { assignment: { courseOffering: { tenantId } }, status: 'SUBMITTED' },
    }),
    prisma.leaveRequest.count({
      where: { tenantId, status: 'PENDING' },
    }),
    prisma.liveClass.count({
      where: { tenantId, status: 'LIVE' },
    }),
    prisma.liveClass.count({
      where: { tenantId, scheduledAt: { gte: startOfToday } },
    }),
    prisma.election.count({
      where: { tenantId, status: 'VOTING_OPEN' },
    }),
    prisma.maintenanceRequest.count({
      where: { tenantId, status: 'OPEN' },
    }),
  ])

  return NextResponse.json({
    pendingAdmissions,
    activeInvites,
    unpaidInvoices,
    ungradedSubmissions,
    pendingLeave,
    liveNow,
    classesToday,
    activeElections,
    openMaintenance,
  })
}
