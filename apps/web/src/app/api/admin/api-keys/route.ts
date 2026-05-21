import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const keys = await prisma.apiKey.findMany({
    where: { tenantId },
    select: { id: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(keys)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { name, scopes, expiresAt } = await req.json()

  const rawKey = `tsm_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 12)

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name,
      keyHash,
      keyPrefix,
      scopes: scopes ?? ['read'],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  // Return the raw key only once — never stored in plain text
  return NextResponse.json({ ...apiKey, rawKey })
}
