import { prisma } from './prisma'

export type ActiveSemester = {
  id: string
  name: string
  termType: string
  status: string
  startDate: Date
  endDate: Date
  launchedAt: Date | null
  registrationOpen: Date | null
  registrationClose: Date | null
  addDropDeadline: Date | null
  academicYear: { id: string; name: string }
}

/**
 * Returns the currently ACTIVE semester for a tenant, or null if none exists.
 * Used by server components to gate semester-dependent pages.
 */
export async function getActiveSemester(tenantId: string): Promise<ActiveSemester | null> {
  const semester = await (prisma as any).semester.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    include: { academicYear: { select: { id: true, name: true } } },
  })
  return semester ?? null
}
