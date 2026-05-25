/**
 * GET  /api/admin/roles?role=REGISTRAR
 *      Returns effective permission map for that role in this tenant.
 *
 * POST /api/admin/roles
 *      Body: { role, permKey, granted }
 *      Upserts a single role-level permission override.
 *
 * DELETE /api/admin/roles
 *      Body: { role, permKey }
 *      Removes override (reverts to default).
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import {
  getRolePermissions, MANAGED_ROLES, ALL_PERM_KEYS,
  defaultPermissions, type PermKey,
} from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const role = req.nextUrl.searchParams.get('role') ?? ''

  if (role && MANAGED_ROLES.includes(role as any)) {
    // Single role
    const perms = await getRolePermissions(tenantId, role)
    const defaults = defaultPermissions(role)
    // Mark which ones are overridden
    const overrides: { permKey: string; granted: boolean }[] = await (prisma as any).rolePermission
      .findMany({ where: { tenantId, role } })
      .catch(() => [])
    const overriddenKeys = new Set(overrides.map(o => o.permKey))
    return NextResponse.json({
      role,
      permissions: perms,
      defaults,
      overriddenKeys: [...overriddenKeys],
    })
  }

  // All roles at once — for the full matrix view
  const allOverrides: { role: string; permKey: string; granted: boolean }[] = await (prisma as any).rolePermission
    .findMany({ where: { tenantId } })
    .catch(() => [])

  const matrix: Record<string, Record<PermKey, boolean>> = {}
  for (const role of MANAGED_ROLES) {
    matrix[role] = defaultPermissions(role)
  }
  for (const o of allOverrides) {
    if (matrix[o.role] && ALL_PERM_KEYS.includes(o.permKey as PermKey)) {
      matrix[o.role][o.permKey as PermKey] = o.granted
    }
  }

  return NextResponse.json({ matrix, overrides: allOverrides })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const { role, permKey, granted } = await req.json()

  if (!MANAGED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (!ALL_PERM_KEYS.includes(permKey)) {
    return NextResponse.json({ error: 'Invalid permission key' }, { status: 400 })
  }

  const result = await (prisma as any).rolePermission.upsert({
    where: { tenantId_role_permKey: { tenantId, role, permKey } },
    update: { granted },
    create: { tenantId, role, permKey, granted },
  })

  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string

  const { role, permKey } = await req.json()

  await (prisma as any).rolePermission.deleteMany({
    where: { tenantId, role, permKey },
  })

  return NextResponse.json({ ok: true })
}
