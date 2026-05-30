import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

const ALLOWED_ROLES = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN']

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId   = (session.user as any).tenantId as string
  const semesterId = req.nextUrl.searchParams.get('semesterId') ?? undefined
  const programId  = req.nextUrl.searchParams.get('programId')  ?? undefined
  const level      = req.nextUrl.searchParams.get('level')      ?? undefined
  const activeOnly = req.nextUrl.searchParams.get('activeOnly') !== 'false'

  const fees = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(semesterId ? { semesterId } : {}),
      ...(programId  ? { programId }  : {}),
      ...(level      ? { level: parseInt(level) } : {}),
    },
    orderBy: [{ billingPeriod: 'asc' }, { name: 'asc' }],
  })

  // Enrich with program and semester names
  const programIds  = [...new Set(fees.map(f => f.programId).filter(Boolean))] as string[]
  const semesterIds = [...new Set(fees.map(f => f.semesterId).filter(Boolean))] as string[]

  const [programs, semesters] = await Promise.all([
    programIds.length > 0
      ? (prisma as any).program.findMany({ where: { id: { in: programIds } }, select: { id: true, name: true, code: true } })
      : [],
    semesterIds.length > 0
      ? prisma.semester.findMany({ where: { id: { in: semesterIds } }, select: { id: true, name: true } })
      : [],
  ])

  const programMap  = Object.fromEntries((programs as any[]).map((p: any) => [p.id, p]))
  const semesterMap = Object.fromEntries((semesters as any[]).map((s: any) => [s.id, s]))

  return NextResponse.json(fees.map(f => ({
    ...f,
    programName:  f.programId  ? (programMap[f.programId]?.name  ?? null) : null,
    programCode:  f.programId  ? (programMap[f.programId]?.code  ?? null) : null,
    semesterName: f.semesterId ? (semesterMap[f.semesterId]?.name ?? null) : null,
  })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes((session.user as any).role))
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const tenantId = (session.user as any).tenantId as string
  const body = await req.json()

  const fee = await prisma.feeStructure.create({
    data: {
      tenantId,
      name:             body.name,
      description:      body.description      || null,
      amount:           parseFloat(body.amount),
      billingPeriod:    body.billingPeriod     || 'SEMESTER',
      semesterId:       body.semesterId        || null,
      level:            body.level             ? parseInt(body.level) : null,
      programId:        body.programId         || null,
      isRecurring:      body.isRecurring       ?? true,
      dueDate:          body.dueDate           ? new Date(body.dueDate) : null,
      lateFee:          body.lateFee           ? parseFloat(body.lateFee) : null,
      lateFeeGraceDays: body.lateFeeGraceDays  ? parseInt(body.lateFeeGraceDays) : 0,
      lateFeePercent:   body.lateFeePercent    ? parseFloat(body.lateFeePercent) : null,
      surchargePercent: body.surchargePercent  ? parseFloat(body.surchargePercent) : null,
    },
  })
  return NextResponse.json(fee, { status: 201 })
}
