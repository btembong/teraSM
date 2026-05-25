import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailNotifications: true, smsNotifications: true, pushNotifications: true },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json()
  const { emailNotifications, smsNotifications, pushNotifications } = body

  const data: Record<string, boolean> = {}
  if (typeof emailNotifications === 'boolean') data.emailNotifications = emailNotifications
  if (typeof smsNotifications === 'boolean') data.smsNotifications = smsNotifications
  if (typeof pushNotifications === 'boolean') data.pushNotifications = pushNotifications

  await prisma.user.update({ where: { id: userId }, data })

  return NextResponse.json({ ok: true })
}
