import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const ALL_CATEGORIES = [
  'ANNOUNCEMENT', 'GRADE_PUBLISHED', 'ASSIGNMENT_DUE',
  'FEE_DUE', 'LIVE_CLASS_STARTING', 'MISSED_CLASS', 'MESSAGE',
] as const

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const [user, prefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { emailNotifications: true, smsNotifications: true, pushNotifications: true },
    }),
    (prisma as any).notificationPreference.findMany({ where: { userId } }),
  ])

  // Build category map — fill defaults for uncustomized categories
  const prefMap: Record<string, { email: boolean; sms: boolean; push: boolean }> = {}
  for (const p of prefs) {
    prefMap[p.category] = { email: p.email, sms: p.sms, push: p.push }
  }
  for (const cat of ALL_CATEGORIES) {
    if (!prefMap[cat]) {
      prefMap[cat] = {
        email: user?.emailNotifications ?? true,
        sms:   user?.smsNotifications  ?? false,
        push:  user?.pushNotifications ?? true,
      }
    }
  }

  return NextResponse.json({ channels: user, categories: prefMap })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId   = (session.user as any).id
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const { emailNotifications, smsNotifications, pushNotifications, category, email, sms, push } = body

  // Global channel master toggles
  if (emailNotifications !== undefined || smsNotifications !== undefined || pushNotifications !== undefined) {
    const data: Record<string, boolean> = {}
    if (typeof emailNotifications === 'boolean') data.emailNotifications = emailNotifications
    if (typeof smsNotifications   === 'boolean') data.smsNotifications   = smsNotifications
    if (typeof pushNotifications  === 'boolean') data.pushNotifications  = pushNotifications
    await prisma.user.update({ where: { id: userId }, data })
  }

  // Per-category override
  if (category) {
    await (prisma as any).notificationPreference.upsert({
      where:  { userId_category: { userId, category } },
      create: { userId, tenantId, category, email: email ?? true, sms: sms ?? false, push: push ?? true },
      update: {
        ...(typeof email === 'boolean' && { email }),
        ...(typeof sms   === 'boolean' && { sms }),
        ...(typeof push  === 'boolean' && { push }),
      },
    })
  }

  return NextResponse.json({ ok: true })
}
