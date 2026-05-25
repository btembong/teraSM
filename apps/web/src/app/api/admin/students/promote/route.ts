/**
 * POST /api/admin/students/promote
 * body: { userIds: string[] }
 *
 * Bumps StudentProfile.level by 100 for each given userId.
 * Skips students already at level 400+.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { userIds } = body
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
  }

  // Fetch current levels
  const profiles = await prisma.studentProfile.findMany({
    where: { tenantId, userId: { in: userIds } },
    select: { id: true, userId: true, level: true },
  })

  let promoted = 0
  const skipped: string[] = []

  for (const p of profiles) {
    if (p.level >= 400) {
      skipped.push(p.userId)
      continue
    }
    await prisma.studentProfile.update({
      where: { id: p.id },
      data:  { level: p.level + 100 },
    })
    promoted++
  }

  return NextResponse.json({ promoted, skipped: skipped.length })
}
