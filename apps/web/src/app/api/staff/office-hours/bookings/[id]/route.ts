import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status } = await req.json()

  const booking = await prisma.officeHourBooking.update({
    where: { id },
    data: { status, ...(status === 'CONFIRMED' ? { updatedAt: new Date() } : {}) },
  })
  return NextResponse.json(booking)
}
