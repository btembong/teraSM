import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/student/onboarding — save profile + emergency contact + mark complete
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { phone, dateOfBirth, gender, emergencyName, emergencyPhone, emergencyRelation } = body

  // Update User fields
  const userUpdate: Record<string, unknown> = { onboardingComplete: true }
  if (phone?.trim())   userUpdate.phone       = phone.trim()
  if (dateOfBirth)     userUpdate.dateOfBirth = new Date(dateOfBirth)
  if (gender)          userUpdate.gender      = gender

  await prisma.user.update({
    where: { id: session.user.id },
    data: userUpdate as Parameters<typeof prisma.user.update>[0]['data'],
  })

  // Save emergency contact to StudentProfile
  if (emergencyName?.trim() || emergencyPhone?.trim() || emergencyRelation?.trim()) {
    await (prisma as any).studentProfile.updateMany({
      where: { userId: session.user.id },
      data: {
        emergencyName:     emergencyName?.trim()     || null,
        emergencyPhone:    emergencyPhone?.trim()    || null,
        emergencyRelation: emergencyRelation?.trim() || null,
      },
    })
  }

  return NextResponse.json({ success: true })
}
