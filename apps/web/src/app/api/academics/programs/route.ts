import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const programs = await (prisma as any).program.findMany({
    where: { tenantId },
    include: {
      department: {
        include: { faculty: { select: { id: true, name: true, code: true } } },
      },
    },
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
  })

  return NextResponse.json(programs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  if (!body.name?.trim() || !body.code?.trim() || !body.departmentId) {
    return NextResponse.json({ message: 'Name, code and department are required' }, { status: 400 })
  }

  // Unique code within tenant
  const conflict = await (prisma as any).program.findFirst({
    where: { tenantId, code: body.code.trim().toUpperCase() },
  })
  if (conflict) return NextResponse.json({ message: 'Program code already exists' }, { status: 409 })

  const program = await (prisma as any).program.create({
    data: {
      tenantId,
      departmentId:    body.departmentId,
      name:            body.name.trim(),
      code:            body.code.trim().toUpperCase(),
      degreeType:      body.degreeType ?? 'BACHELOR',
      durationYears:   body.durationYears ?? 4,
      requiredCredits: body.requiredCredits ?? 120,
      description:     body.description?.trim() || null,
      isActive:        body.isActive ?? true,
    },
    include: { department: { select: { id: true, name: true, code: true } } },
  })

  return NextResponse.json(program, { status: 201 })
}
