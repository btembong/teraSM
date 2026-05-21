import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StaffLeaveClient from './StaffLeaveClient'

export default async function StaffLeavePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const employee = await prisma.employee.findFirst({
    where: { tenantId, userId },
    include: {
      leaveBalances: { include: { leaveType: true }, where: { year: new Date().getFullYear() } },
      leaveRequests: { include: { leaveType: true }, orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId, isActive: true } })

  return <StaffLeaveClient employee={employee} leaveTypes={leaveTypes} />
}
