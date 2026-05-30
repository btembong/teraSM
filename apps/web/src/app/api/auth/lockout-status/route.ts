import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auth/lockout-status?email=...&slug=...
// Public — returns lockout info only (no sensitive data).
// Called by the login page after a failed signIn to show a helpful error.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email = searchParams.get('email')?.toLowerCase().trim()
  const slug  = searchParams.get('slug') ?? undefined

  if (!email) return NextResponse.json({ locked: false })

  let tenantId: string | undefined
  if (slug) {
    const tenant = await prisma.tenant.findFirst({ where: { slug }, select: { id: true } })
    tenantId = tenant?.id
  }

  const user = await prisma.user.findFirst({
    where:  tenantId ? { email, tenantId } : { email },
    select: { lockedUntil: true, status: true },
  })

  if (!user) return NextResponse.json({ locked: false })

  if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    return NextResponse.json({ locked: true, reason: 'suspended' })
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return NextResponse.json({ locked: true, reason: 'brute_force', minutesLeft })
  }

  return NextResponse.json({ locked: false })
}
