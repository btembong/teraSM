import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      OR: [
        { name:    { contains: q, mode: 'insensitive' } },
        { slug:    { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ],
      status: { not: 'CANCELLED' },
    },
    select: {
      id:      true,
      name:    true,
      slug:    true,
      country: true,
      logoUrl: true,
      plan:    true,
    },
    take: 8,
  })

  return NextResponse.json(tenants)
}
