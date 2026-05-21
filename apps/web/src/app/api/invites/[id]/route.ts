import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/invites/[id] — revoke an invite
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const invite = await prisma.invite.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })

  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.invite.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
