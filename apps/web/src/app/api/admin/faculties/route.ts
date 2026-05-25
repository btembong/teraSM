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

// GET — list all faculties with department counts
export async function GET() {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const faculties = await (prisma as any).faculty.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { departments: true } },
      departments: {
        select: {
          id: true, name: true, code: true,
          _count: { select: { courses: true } },
          programs: {
            select: { id: true, name: true, code: true, degreeType: true, durationYears: true, requiredCredits: true, isActive: true },
            orderBy: { name: 'asc' as const },
          },
        },
        orderBy: { name: 'asc' as const },
      },
    },
  })

  return NextResponse.json(faculties)
}

// POST — create faculty
export async function POST(req: NextRequest) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, code, description } = await req.json()
  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
  }

  const faculty = await (prisma as any).faculty.create({
    data: {
      tenantId: session.user.tenantId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
    },
  })

  return NextResponse.json(faculty, { status: 201 })
}
