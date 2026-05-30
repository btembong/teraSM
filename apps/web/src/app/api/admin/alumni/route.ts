import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/alumni — list all alumni profiles for the tenant
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId, role } = session.user as any
  if (!['TENANT_ADMIN', 'REGISTRAR'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const alumni = await prisma.alumniProfile.findMany({
    where: {
      tenantId,
      ...(search ? {
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName:  { contains: search, mode: 'insensitive' } } },
          { major:           { contains: search, mode: 'insensitive' } },
          { currentEmployer: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, profilePicUrl: true } },
    },
    orderBy: { graduationYear: 'desc' },
  })

  return NextResponse.json(alumni)
}
