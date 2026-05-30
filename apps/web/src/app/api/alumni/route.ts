import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alumni — list public alumni profiles for the tenant
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId } = session.user as any

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const major  = searchParams.get('major')  || ''

  const alumni = await prisma.alumniProfile.findMany({
    where: {
      tenantId,
      isPublic: true,
      ...(major ? { major } : {}),
      ...(search ? {
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName:  { contains: search, mode: 'insensitive' } } },
          { currentEmployer: { contains: search, mode: 'insensitive' } },
          { currentRole:     { contains: search, mode: 'insensitive' } },
          { major:           { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } },
    },
    orderBy: { graduationYear: 'desc' },
  })

  return NextResponse.json(alumni)
}

// POST /api/alumni — create or update own alumni profile
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: userId, tenantId } = session.user as any

  const body = await req.json()
  const { graduationYear, degree, major, currentEmployer, currentRole, linkedIn, bio, isPublic } = body

  if (!graduationYear) {
    return NextResponse.json({ message: 'Graduation year is required.' }, { status: 400 })
  }

  const profile = await prisma.alumniProfile.upsert({
    where: { userId },
    create: {
      tenantId,
      userId,
      graduationYear: Number(graduationYear),
      degree:          degree?.trim()          || null,
      major:           major?.trim()           || null,
      currentEmployer: currentEmployer?.trim() || null,
      currentRole:     currentRole?.trim()     || null,
      linkedIn:        linkedIn?.trim()        || null,
      bio:             bio?.trim()             || null,
      isPublic:        isPublic !== false,
    },
    update: {
      graduationYear:  Number(graduationYear),
      degree:          degree?.trim()          ?? undefined,
      major:           major?.trim()           ?? undefined,
      currentEmployer: currentEmployer?.trim() ?? undefined,
      currentRole:     currentRole?.trim()     ?? undefined,
      linkedIn:        linkedIn?.trim()        ?? undefined,
      bio:             bio?.trim()             ?? undefined,
      isPublic:        isPublic !== false,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } } },
  })

  return NextResponse.json(profile)
}
