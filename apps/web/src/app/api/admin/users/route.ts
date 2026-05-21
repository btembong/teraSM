import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// GET /api/admin/users?role=&search=&page=
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const role   = searchParams.get('role')   ?? ''
  const search = searchParams.get('search') ?? ''
  const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit  = 20

  const where: any = { tenantId: session.user.tenantId }
  if (role && role !== 'ALL') where.role = role
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName:  { contains: search, mode: 'insensitive' } },
      { email:     { contains: search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, status: true,
        avatarUrl: true, createdAt: true, lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
}

// POST /api/admin/users — create user directly
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { firstName, lastName, email, password, role } = await req.json()

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password || !role) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: { tenantId: session.user.tenantId, email: email.toLowerCase() },
  })
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      tenantId: session.user.tenantId,
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      passwordHash,
      role,
      status: 'ACTIVE',
      onboardingComplete: true,
    },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, role: true, status: true, createdAt: true,
    },
  })

  // Send welcome email (non-blocking)
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true },
  })
  sendWelcomeEmail({
    to: user.email,
    firstName: user.firstName,
    schoolName: tenant?.name ?? 'Your School',
    temporaryPassword: password,
  }).catch(err => console.error('[welcome email]', err))

  return NextResponse.json(user, { status: 201 })
}
