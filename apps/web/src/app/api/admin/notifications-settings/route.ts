import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  return NextResponse.json({ settings })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...body },
    update: body,
  })

  return NextResponse.json({ settings })
}
