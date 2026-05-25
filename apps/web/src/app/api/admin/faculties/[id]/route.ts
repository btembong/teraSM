import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['TENANT_ADMIN', 'REGISTRAR']

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return null
  if (!ADMIN_ROLES.includes(session.user.role)) return null
  return session
}

// PATCH — update faculty
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { name, code, description } = await req.json()

  const updated = await (prisma as any).faculty.update({
    where: { id },
    data: {
      ...(name?.trim()        && { name: name.trim() }),
      ...(code?.trim()        && { code: code.trim().toUpperCase() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  })
  return NextResponse.json(updated)
}

// DELETE — delete faculty (only if no departments)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const deptCount = await prisma.department.count({ where: { facultyId: id } })
  if (deptCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${deptCount} department(s) are assigned to this faculty. Reassign them first.` },
      { status: 400 },
    )
  }

  await (prisma as any).faculty.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
