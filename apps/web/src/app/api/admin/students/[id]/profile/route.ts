import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/students/[id]/profile
// Updates academic placement: programme, level, admission year, expected grad year, transfer credits, CGPA override
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const body = await req.json()

  // Confirm student belongs to this tenant
  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId, role: 'STUDENT' },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Validate programId if provided
  if (body.programId) {
    const program = await (prisma as any).program.findFirst({
      where: { id: body.programId, tenantId: session.user.tenantId },
    })
    if (!program) return NextResponse.json({ error: 'Programme not found' }, { status: 404 })
  }

  const data: Record<string, any> = {}
  if (body.programId   !== undefined) data.programId        = body.programId || null
  if (body.level       !== undefined) data.level            = Number(body.level)
  if (body.admissionYear !== undefined) data.admissionYear  = Number(body.admissionYear)
  if (body.expectedGradYear !== undefined) data.expectedGradYear = body.expectedGradYear ? Number(body.expectedGradYear) : null
  if (body.transferCredits  !== undefined) data.totalCredits     = Math.max(0, Number(body.transferCredits ?? 0)) + (body.keepExistingCredits ? 0 : 0)
  if (body.cgpa        !== undefined) data.cgpa             = body.cgpa ? parseFloat(body.cgpa) : null

  const profile = await (prisma as any).studentProfile.upsert({
    where: { userId: id },
    update: data,
    create: {
      tenantId:      session.user.tenantId,
      userId:        id,
      studentId:     `STU/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9000) + 1000)}`,
      admissionYear: data.admissionYear ?? new Date().getFullYear(),
      level:         data.level ?? 100,
      ...data,
    },
    include: { program: { select: { name: true, code: true } } },
  })

  return NextResponse.json({
    programName:      profile.program?.name ?? null,
    programCode:      profile.program?.code ?? null,
    level:            profile.level,
    admissionYear:    profile.admissionYear,
    expectedGradYear: profile.expectedGradYear ?? null,
    cgpa:             profile.cgpa,
    totalCredits:     profile.totalCredits,
  })
}
