import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const PIN_REGEX = /^\d{4,6}$/

// GET /api/user/pin — check whether the signed-in user has a PIN set
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pinHash: true },
  })

  return NextResponse.json({ pinSet: !!user?.pinHash })
}

// POST /api/user/pin — set a new PIN (user must not already have one)
// Body: { pin: string; password: string }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pin, password } = await req.json().catch(() => ({}))

  if (!PIN_REGEX.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits.' }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required to set a PIN.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, pinHash: true },
  })
  if (!user?.passwordHash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.pinHash) {
    return NextResponse.json({ error: 'PIN already set. Use PUT to change it.' }, { status: 409 })
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 })
  }

  const pinHash = await bcrypt.hash(pin, 10)
  await prisma.user.update({ where: { id: session.user.id }, data: { pinHash } })

  return NextResponse.json({ message: 'PIN set successfully.' })
}

// PUT /api/user/pin — change existing PIN
// Body: { currentPin: string; newPin: string; password: string }
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPin, newPin, password } = await req.json().catch(() => ({}))

  if (!PIN_REGEX.test(newPin)) {
    return NextResponse.json({ error: 'New PIN must be 4–6 digits.' }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required to change PIN.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, pinHash: true },
  })
  if (!user?.passwordHash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.pinHash) {
    return NextResponse.json({ error: 'No PIN set. Use POST to create one.' }, { status: 404 })
  }

  const [passwordMatch, pinMatch] = await Promise.all([
    bcrypt.compare(password, user.passwordHash),
    bcrypt.compare(currentPin ?? '', user.pinHash),
  ])
  if (!passwordMatch) return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 })
  if (!pinMatch)      return NextResponse.json({ error: 'Incorrect current PIN.' }, { status: 403 })

  const pinHash = await bcrypt.hash(newPin, 10)
  await prisma.user.update({ where: { id: session.user.id }, data: { pinHash } })

  return NextResponse.json({ message: 'PIN changed successfully.' })
}

// DELETE /api/user/pin — remove PIN
// Body: { password: string }
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { password } = await req.json().catch(() => ({}))
  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })
  if (!user?.passwordHash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 })

  await prisma.user.update({ where: { id: session.user.id }, data: { pinHash: null } })

  return NextResponse.json({ message: 'PIN removed.' })
}
