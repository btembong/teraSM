import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true, lastName: true, email: true,
      phone: true, dateOfBirth: true, gender: true, avatarUrl: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { firstName, lastName, phone, dateOfBirth, gender, avatarUrl } = body

  const data: Record<string, unknown> = {}
  if (firstName?.trim()) data.firstName = firstName.trim()
  if (lastName?.trim())  data.lastName  = lastName.trim()
  if (phone?.trim())     data.phone     = phone.trim()
  if (gender)            data.gender    = gender
  if (avatarUrl?.trim()) data.avatarUrl = avatarUrl.trim()
  if (dateOfBirth)       data.dateOfBirth = new Date(dateOfBirth)

  await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ success: true })
}
