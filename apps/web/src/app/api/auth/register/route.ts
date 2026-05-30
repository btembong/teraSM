import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendTeraWelcomeEmail, sendTrialStartEmail } from '@/lib/email'
import { scheduleDripEmails } from '@/lib/drip'
import { verifyEmailToken } from '@/app/api/auth/verify-otp/route'
import { rateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

const Schema = z.object({
  // Admin credentials
  firstName:  z.string().min(1),
  lastName:   z.string().min(1),
  email:      z.string().email(),
  password:   z.string().min(8),
  emailToken: z.string().min(1), // issued by verify-otp after OTP confirmation

  // School identity
  schoolName:         z.string().min(2),
  shortName:          z.string().optional(),
  institutionType:    z.string().optional(),
  yearEstablished:    z.string().optional(),
  registrationNumber: z.string().optional(),
  accreditationBody:  z.string().optional(),
  motto:              z.string().optional(),
  description:        z.string().optional(),
  studentCount:       z.string().optional(),
  staffCount:         z.string().optional(),

  // Location & contact
  country:     z.string().min(1),
  state:       z.string().optional(),
  city:        z.string().optional(),
  address:     z.string().optional(),
  postalCode:  z.string().optional(),
  phone:       z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal('')),
  website:     z.string().optional(),

  // Academic setup
  academicCalendar: z.string().optional(),
  gradingSystem:    z.string().optional(),
  language:         z.string().optional(),
  timezone:         z.string().optional(),
  currency:         z.string().optional(),

  // Branding
  subdomain:    z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  primaryColor: z.string().optional(),
  accentColor:  z.string().optional(),
  logoUrl:      z.string().optional(), // base64 or URL

  // Plan
  plan:    z.enum(['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY']),
  billing: z.enum(['monthly', 'annual']).optional(),
})

const PLAN_CAPS: Record<string, { studentCap: number; storageCap: number }> = {
  STARTER:    { studentCap: 500,   storageCap: 10  },
  PRO:        { studentCap: 3000,  storageCap: 100 },
  ENTERPRISE: { studentCap: 10000, storageCap: 500 },
  UNIVERSITY: { studentCap: 99999, storageCap: 9999 },
}

export async function POST(req: Request) {
  try {
    // Rate limit: 5 registration attempts per IP per hour
    const ip = (req as any).headers?.get?.('x-forwarded-for') ?? 'unknown'
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(rateLimitExceededResponse(rl.resetAt), { status: 429 })
    }

    const body   = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      )
    }

    const d = parsed.data

    // ── Verify email ownership via token issued by verify-otp ──────────────
    const verifiedEmail = verifyEmailToken(d.emailToken)
    if (!verifiedEmail || verifiedEmail.toLowerCase() !== d.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email verification required. Please complete the OTP step.' },
        { status: 403 },
      )
    }

    // ── Uniqueness checks ──────────────────────────────────
    const [slugTaken, emailTaken] = await Promise.all([
      prisma.tenant.findFirst({ where: { slug: d.subdomain } }),
      prisma.user.findFirst({ where: { email: d.email } }),
    ])
    if (slugTaken)  return NextResponse.json({ error: 'That subdomain is already taken.' }, { status: 409 })
    if (emailTaken) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })

    // ── Hash credentials ───────────────────────────────────
    const passwordHash = await bcrypt.hash(d.password, 12)

    const caps       = PLAN_CAPS[d.plan]
    const trialEndsAt = (d.plan === 'STARTER' || d.plan === 'PRO')
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : null

    // ── Create tenant + admin user in one transaction ──────
    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name:       d.schoolName,
          slug:       d.subdomain,
          plan:       d.plan,
          status:     'TRIAL',
          email:      d.schoolEmail || d.email,
          phone:      d.phone,
          country:    d.country,
          timezone:   d.timezone ?? 'UTC',
          currency:   d.currency ?? 'USD',
          logoUrl:    d.logoUrl,
          studentCap: caps.studentCap,
          storageCap: caps.storageCap,
          trialEndsAt,
        },
      })

      await tx.user.create({
        data: {
          tenantId:           t.id,
          email:              d.email,
          emailVerified:      new Date(), // verified by emailToken (issued after OTP)
          firstName:          d.firstName,
          lastName:           d.lastName,
          passwordHash,
          pinHash: null,
          role:               'TENANT_ADMIN',
          status:             'ACTIVE',
          onboardingComplete: false,
        } as any,
      })

      await tx.tenantSettings.create({
        data: {
          tenantId:       t.id,
          primaryColor:   d.primaryColor  ?? '#2563EB',
          secondaryColor: d.accentColor   ?? '#7C3AED',
          accentColor:    d.accentColor   ?? '#7C3AED',
        },
      })

      return t
    })

    // Schedule drip email sequence (non-blocking, trial plans only)
    if (trialEndsAt) {
      scheduleDripEmails({
        tenantId:   tenant.id,
        email:      d.email,
        firstName:  d.firstName,
        schoolName: d.schoolName,
      }).catch(err => console.error('[drip schedule]', err))
    }

    // Send Tera welcome + trial start emails (non-blocking)
    if (trialEndsAt) {
      sendTeraWelcomeEmail({
        to: d.email,
        firstName: d.firstName,
        schoolName: d.schoolName,
      }).catch(err => console.error('[tera welcome email]', err))

      sendTrialStartEmail({
        to: d.email,
        firstName: d.firstName,
        schoolName: d.schoolName,
        trialEndsAt,
        plan: d.plan,
      }).catch(err => console.error('[trial start email]', err))
    } else {
      sendTeraWelcomeEmail({
        to: d.email,
        firstName: d.firstName,
        schoolName: d.schoolName,
      }).catch(err => console.error('[tera welcome email]', err))
    }

    return NextResponse.json({
      success:  true,
      tenantId: tenant.id,
      subdomain: tenant.slug,
    }, { status: 201 })

  } catch (err) {
    console.error('[register-tenant]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
