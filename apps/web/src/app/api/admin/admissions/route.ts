import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''

  const where: any = { tenantId }
  if (status && status !== 'ALL') where.status = status
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName:  { contains: search, mode: 'insensitive' } },
      { email:     { contains: search, mode: 'insensitive' } },
    ]
  }

  const applications = await (prisma as any).admissionApplication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      admissionDocuments: {
        select: { id: true, docType: true, status: true, fileName: true, fileUrl: true },
      },
    },
  })

  return NextResponse.json(applications)
}
