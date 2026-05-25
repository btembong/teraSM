import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json([], { status: 401 })

  const tenantId = (session.user as any).tenantId
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const rolesParam = url.searchParams.get('roles') ?? ''
  const roles = rolesParam ? rolesParam.split(',') : []

  if (!q) return NextResponse.json([])

  const users = await prisma.user.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      ...(roles.length > 0 ? { role: { in: roles as any[] } } : {}),
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, role: true },
    take: 20,
  })

  return NextResponse.json(users)
}
