/**
 * GET    /api/admin/roles/users/[userId]
 *        Returns effective permissions + overrides for a specific user.
 *
 * POST   /api/admin/roles/users/[userId]
 *        Body: { permKey, granted }  — upsert a user-level override.
 *
 * DELETE /api/admin/roles/users/[userId]
 *        Body: { permKey }           — remove override (revert to role default).
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getUserEffectivePermissions, ALL_PERM_KEYS, type PermKey } from '@/lib/permissions'

type Params = { params: Promise<{ userId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { userId } = await params

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const effectivePerms = await getUserEffectivePermissions(tenantId, userId, user.role)
  const overrides: { permKey: string; granted: boolean }[] = await (prisma as any).userPermissionOverride
    .findMany({ where: { tenantId, userId } })
    .catch(() => [])

  return NextResponse.json({ user, effectivePerms, overrides })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { userId } = await params

  const user = await prisma.user.findFirst({ where: { id: userId, tenantId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { permKey, granted } = await req.json()
  if (!ALL_PERM_KEYS.includes(permKey as PermKey)) {
    return NextResponse.json({ error: 'Invalid permission key' }, { status: 400 })
  }

  const result = await (prisma as any).userPermissionOverride.upsert({
    where: { tenantId_userId_permKey: { tenantId, userId, permKey } },
    update: { granted },
    create: { tenantId, userId, permKey, granted },
  })

  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { userId } = await params

  const { permKey } = await req.json()

  await (prisma as any).userPermissionOverride.deleteMany({
    where: { tenantId, userId, permKey },
  })

  return NextResponse.json({ ok: true })
}
