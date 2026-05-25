import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const campuses = await (prisma as any).campus.findMany({
    where: { tenantId },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json(campuses)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const body = await req.json()
  const { name, code, address, city, phone, email, isMain } = body

  if (!name || !code) {
    return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
  }

  // If marking as main, unset all others
  if (isMain) {
    await (prisma as any).campus.updateMany({
      where: { tenantId },
      data: { isMain: false },
    })
  }

  const campus = await (prisma as any).campus.create({
    data: {
      tenantId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address ?? null,
      city: city ?? null,
      phone: phone ?? null,
      email: email ?? null,
      isMain: isMain ?? false,
    },
  })

  return NextResponse.json(campus, { status: 201 })
}
