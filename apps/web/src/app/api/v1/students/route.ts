import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

async function authenticateApiKey(req: Request): Promise<{ tenantId: string; scopes: string[] } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.substring(7)
  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { tenantId: true, scopes: true, isActive: true, expiresAt: true },
  })

  if (!apiKey || !apiKey.isActive) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  // Update last used
  await prisma.apiKey.update({ where: { keyHash }, data: { lastUsedAt: new Date() } })

  return { tenantId: apiKey.tenantId, scopes: apiKey.scopes as string[] }
}

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const skip = (page - 1) * limit

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: auth.tenantId, role: 'STUDENT' },
      select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { tenantId: auth.tenantId, role: 'STUDENT' } }),
  ])

  return NextResponse.json({
    data: students,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}
