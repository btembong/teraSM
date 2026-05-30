import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alumni/me — return the logged-in user's own alumni profile (if any)
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: userId } = session.user as any

  const profile = await prisma.alumniProfile.findUnique({
    where: { userId },
    include: { user: { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } } },
  })

  if (!profile) return NextResponse.json(null, { status: 200 })
  return NextResponse.json(profile)
}
