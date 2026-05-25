/**
 * GET  /api/admin/roles/users?search=...
 *      Returns admin-role users with their permission overrides.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { MANAGED_ROLES } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const search = req.nextUrl.searchParams.get('search') ?? ''

  const where: any = {
    tenantId,
    role: { in: MANAGED_ROLES },
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName:  { contains: search, mode: 'insensitive' } },
      { email:     { contains: search, mode: 'insensitive' } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, firstName: true, lastName: true, email: true, role: true,
      permissionOverrides: {
        where: { tenantId },
        select: { permKey: true, granted: true },
      },
    },
    orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    take: 50,
  })

  return NextResponse.json(users)
}
