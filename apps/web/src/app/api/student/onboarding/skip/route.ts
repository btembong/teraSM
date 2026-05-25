import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/student/onboarding/skip — mark complete and redirect to dashboard
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingComplete: true },
  })

  return NextResponse.redirect(new URL('/student', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))
}
