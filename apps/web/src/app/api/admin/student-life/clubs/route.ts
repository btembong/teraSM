import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { name, description, category, maxMembers } = await req.json()

  const club = await prisma.club.create({
    data: { tenantId, name, description: description || null, category, maxMembers: maxMembers || null },
  })
  return NextResponse.json(club)
}
