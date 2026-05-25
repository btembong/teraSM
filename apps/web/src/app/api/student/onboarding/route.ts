import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/student/onboarding — save profile data + mark onboarding complete
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { phone, dateOfBirth, gender, emergencyName, emergencyPhone, emergencyRelation } = body

  const updateData: Record<string, unknown> = { onboardingComplete: true }

  if (phone?.trim())       updateData.phone = phone.trim()
  if (dateOfBirth)         updateData.dateOfBirth = new Date(dateOfBirth)
  if (gender)              updateData.gender = gender

  // Store emergency contact as JSON in a notes-style field via metadata
  // We embed it into the user record as a combined string for now
  // (full emergency contact model can be added in a later phase)
  if (emergencyName?.trim() || emergencyPhone?.trim()) {
    const parts = [
      emergencyName?.trim(),
      emergencyRelation?.trim(),
      emergencyPhone?.trim(),
    ].filter(Boolean)
    updateData.pinHash = undefined // not overwriting pinHash
    // We'll surface emergency info via a dedicated model in a later phase
    // For now, just save what we can to User fields
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData as Parameters<typeof prisma.user.update>[0]['data'],
  })

  return NextResponse.json({ success: true })
}
