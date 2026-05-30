import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendAlumniWelcomeEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// POST /api/alumni/register — public, no auth required
// Body: { school, firstName, lastName, email, password, graduationYear, degree, major,
//         currentEmployer, currentRole, linkedIn, bio }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      school, firstName, lastName, email, password,
      graduationYear, degree, major, currentEmployer, currentRole, linkedIn, bio,
    } = body

    // Validate required fields
    if (!school?.trim())        return NextResponse.json({ message: 'School identifier is required.' }, { status: 400 })
    if (!firstName?.trim())     return NextResponse.json({ message: 'First name is required.' }, { status: 400 })
    if (!lastName?.trim())      return NextResponse.json({ message: 'Last name is required.' }, { status: 400 })
    if (!email?.trim())         return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
    if (!password || password.length < 8) return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 })
    if (!graduationYear)        return NextResponse.json({ message: 'Graduation year is required.' }, { status: 400 })

    // Resolve tenant
    const tenant = await prisma.tenant.findFirst({ where: { slug: school.trim().toLowerCase() } })
    if (!tenant) return NextResponse.json({ message: 'School not found. Please check the link you used.' }, { status: 404 })

    // Check email not already in use
    const existing = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase() } })
    if (existing) return NextResponse.json({ message: 'An account with this email already exists. Please log in instead.' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)

    // Create user + alumni profile in one transaction
    const { user, profile } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId:      tenant.id,
          email:         email.trim().toLowerCase(),
          emailVerified: new Date(),
          firstName:     firstName.trim(),
          lastName:      lastName.trim(),
          passwordHash,
          role:           'ALUMNI',
          status:         'ACTIVE',
          onboardingComplete: true,
        },
      })

      const profile = await tx.alumniProfile.create({
        data: {
          tenantId:        tenant.id,
          userId:          user.id,
          graduationYear:  Number(graduationYear),
          degree:          degree?.trim()          || null,
          major:           major?.trim()           || null,
          currentEmployer: currentEmployer?.trim() || null,
          currentRole:     currentRole?.trim()     || null,
          linkedIn:        linkedIn?.trim()        || null,
          bio:             bio?.trim()             || null,
          isPublic:        true,
        },
      })

      return { user, profile }
    })

    // Send welcome email (non-blocking)
    sendAlumniWelcomeEmail({
      to:         user.email,
      firstName:  user.firstName,
      schoolName: tenant.name,
      loginUrl:   `${APP_URL}/login`,
    }).catch(err => console.error('[alumni-welcome-email]', err))

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (err) {
    console.error('[alumni-register]', err)
    return NextResponse.json({ message: 'Server error. Please try again.' }, { status: 500 })
  }
}
