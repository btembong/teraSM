import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/users/[id] — update name, email, role, or status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check email uniqueness if changing email
  if (body.email && body.email.toLowerCase() !== user.email) {
    const conflict = await prisma.user.findFirst({
      where: { tenantId: session.user.tenantId, email: body.email.toLowerCase(), NOT: { id } },
    })
    if (conflict) return NextResponse.json({ error: 'Email already in use by another user' }, { status: 409 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(body.firstName && { firstName: body.firstName.trim() }),
      ...(body.lastName  && { lastName:  body.lastName.trim()  }),
      ...(body.email     && { email:     body.email.toLowerCase().trim() }),
      ...(body.role      && { role:      body.role   }),
      ...(body.status    && { status:    body.status }),
    },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, role: true, status: true, createdAt: true, lastLoginAt: true,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  if (id === (session.user as any).id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
