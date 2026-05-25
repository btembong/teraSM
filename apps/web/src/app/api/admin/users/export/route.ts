import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/export?role=&search=
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const role     = searchParams.get('role')     ?? ''
  const search   = searchParams.get('search')   ?? ''
  const standing = searchParams.get('standing') ?? ''

  const where: any = { tenantId: session.user.tenantId }
  if (role && role !== 'ALL') where.role = role
  if (standing && standing !== 'ALL') where.academicStanding = standing
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
      firstName: true, lastName: true, email: true,
      role: true, status: true, createdAt: true, lastLoginAt: true,
      phone: true, academicStanding: true, standingNote: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const header = 'First Name,Last Name,Email,Phone,Role,Status,Academic Standing,Standing Note,Joined,Last Login'
  const rows = users.map(u =>
    [
      u.firstName,
      u.lastName,
      u.email,
      u.phone ?? '',
      u.role,
      u.status,
      u.academicStanding ?? '',
      u.standingNote ?? '',
      u.createdAt.toISOString().split('T')[0],
      u.lastLoginAt ? u.lastLoginAt.toISOString().split('T')[0] : '',
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
