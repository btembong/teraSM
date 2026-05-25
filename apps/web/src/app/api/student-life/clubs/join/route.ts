import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const { clubId } = await req.json()

  const existing = await prisma.clubMembership.findFirst({ where: { tenantId, clubId, userId: studentId } })
  if (existing) {
    if (existing.status === 'ACTIVE') return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    const updated = await prisma.clubMembership.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } })
    return NextResponse.json(updated)
  }

  const membership = await prisma.clubMembership.create({
    data: { tenantId, clubId, userId: studentId, role: 'MEMBER', status: 'ACTIVE' },
  })
  return NextResponse.json(membership)
}
