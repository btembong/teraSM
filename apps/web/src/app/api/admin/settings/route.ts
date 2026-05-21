import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.tenantSettings.findUnique({ where: { tenantId } }),
  ])

  return NextResponse.json({ tenant, settings })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { tenant: tenantData, settings: settingsData } = await req.json()

  const [tenant, settings] = await Promise.all([
    tenantData ? prisma.tenant.update({ where: { id: tenantId }, data: tenantData }) : null,
    settingsData
      ? prisma.tenantSettings.upsert({
          where: { tenantId },
          create: { tenantId, ...settingsData },
          update: settingsData,
        })
      : null,
  ])

  return NextResponse.json({ tenant, settings })
}
