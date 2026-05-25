import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendOtpEmail } from '@/lib/email'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      firstName: true,
      passwordHash: true,
      twoFactorEnabled: true,
    },
  })

  // Always return the same shape — never leak whether the user exists
  if (!user || !user.passwordHash) {
    return NextResponse.json({ requires2fa: false })
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return NextResponse.json({ requires2fa: false })
  }

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ requires2fa: false })
  }

  // Generate OTP, store hashed, send email
  const otp = generateOtp()
  const otpHash = await bcrypt.hash(otp, 10)
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: otpHash, otpExpiry },
  })

  sendOtpEmail({
    to: email,
    firstName: user.firstName,
    otp,
    expiresInMinutes: 10,
  }).catch(err => console.error('[2fa otp email]', err))

  return NextResponse.json({ requires2fa: true })
}
