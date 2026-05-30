import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'STAFF', 'HR_ADMIN', 'FINANCE_ADMIN']

// GET /api/admin/chat/channels — list all announcement channels
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const channels = await (prisma as any).conversation.findMany({
    where: { tenantId, type: 'ANNOUNCEMENT' },
    include: {
      _count: { select: { participants: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(channels)
}

// POST /api/admin/chat/channels — create a department announcement channel
// Body: { name, description?, departmentId?, audience: 'ALL'|'STUDENTS'|'TEACHERS'|'STAFF' }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenantId = (session.user as any).tenantId
  const adminId  = (session.user as any).id
  const body     = await req.json()
  const { name, description, departmentId, audience } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Create the channel
  const channel = await (prisma as any).conversation.create({
    data: {
      tenantId,
      type:         'ANNOUNCEMENT',
      name:         name.trim(),
      description:  description?.trim() || null,
      departmentId: departmentId || null,
      createdById:  adminId,
      participants: {
        create: [{ tenantId, userId: adminId, isAdmin: true }],
      },
    },
  })

  // Fan-out: add all relevant users as participants based on audience
  const roleFilter: Record<string, string[]> = {
    ALL:      ['STUDENT', 'TEACHER', 'STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
    STUDENTS: ['STUDENT'],
    TEACHERS: ['TEACHER'],
    STAFF:    ['STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
  }
  const roles = roleFilter[audience ?? 'ALL'] ?? roleFilter.ALL

  const userWhere: any = { tenantId, role: { in: roles as any[] }, id: { not: adminId } }
  if (departmentId) {
    // filter by department via StudentProfile or staff assignment — simplest: just use role filter
    // (department filtering on user is not yet in schema at user level)
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  })

  if (users.length > 0) {
    await (prisma as any).conversationParticipant.createMany({
      data: users.map(u => ({ tenantId, conversationId: channel.id, userId: u.id })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ ...channel, participantCount: users.length + 1 }, { status: 201 })
}
