import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const webhooks = await prisma.webhook.findMany({
    where: { tenantId },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(webhooks)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { url, events } = await req.json()
  const secret = `whsec_${randomBytes(24).toString('hex')}`

  const webhook = await prisma.webhook.create({
    data: { tenantId, url, secret, events },
  })

  return NextResponse.json({ ...webhook })
}
