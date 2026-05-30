import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { LoginSchema } from '@tera-sm/types'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

// Roles that MUST use 2FA — cannot bypass with password alone
const ROLES_REQUIRING_2FA = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN', 'TEACHER', 'STAFF']

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),

    Credentials({
      // slug — school subdomain passed from login page so we scope by tenantId
      credentials: { email: {}, password: {}, otp: {}, slug: {} },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim()
        if (!email) return null

        // ── Resolve tenant from slug when provided ────────────────────────────
        let tenantId: string | undefined
        const slug = credentials?.slug as string | undefined
        if (slug) {
          const tenant = await prisma.tenant.findFirst({
            where: { slug },
            select: { id: true },
          })
          tenantId = tenant?.id
        }

        const user = await prisma.user.findFirst({
          where: tenantId ? { email, tenantId } : { email },
          include: { tenant: true },
        }) as any
        if (!user) return null

        // ── Account suspended / inactive check ────────────────────────────────
        if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') return null

        // ── Brute-force lockout check ─────────────────────────────────────────
        if (user.lockedUntil && user.lockedUntil > new Date()) return null

        // ── OTP verification path (second step of 2FA) ────────────────────────
        if (credentials?.otp) {
          if (!user.otpCode || !user.otpExpiry) return null
          if (new Date() > user.otpExpiry) return null
          const otpMatch = await bcrypt.compare(credentials.otp as string, user.otpCode)
          if (!otpMatch) return null

          // Consume OTP + clear lockout + update login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: {
              otpCode:             null,
              otpExpiry:           null,
              failedLoginAttempts: 0,
              lockedUntil:         null,
              lastLoginAt:         new Date(),
            },
          })

          return {
            id:                 user.id,
            email:              user.email,
            name:               `${user.firstName} ${user.lastName}`,
            image:              user.avatarUrl,
            role:               user.role,
            tenantId:           user.tenantId,
            sessionVersion:     user.sessionVersion,
            onboardingComplete: user.onboardingComplete,
          }
        }

        // ── Password path ─────────────────────────────────────────────────────
        const validated = LoginSchema.safeParse(credentials)
        if (!validated.success) return null
        if (!user.passwordHash) return null

        const passwordMatch = await bcrypt.compare(validated.data.password, user.passwordHash)
        if (!passwordMatch) {
          // Track failed attempt — lock after MAX_FAILED_ATTEMPTS
          const attempts = user.failedLoginAttempts + 1
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: attempts >= MAX_FAILED_ATTEMPTS
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                : null,
            },
          })
          return null
        }

        // ── 2FA enforcement ───────────────────────────────────────────────────
        // For privileged roles, 2FA is mandatory regardless of twoFactorEnabled flag.
        // check-2fa has already sent the OTP — deny the direct password login.
        const requires2FA = user.twoFactorEnabled || ROLES_REQUIRING_2FA.includes(user.role)
        if (requires2FA) return null

        // ── Successful non-2FA login ──────────────────────────────────────────
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil:         null,
            lastLoginAt:         new Date(),
          },
        })

        return {
          id:                 user.id,
          email:              user.email,
          name:               `${user.firstName} ${user.lastName}`,
          image:              user.avatarUrl,
          role:               user.role,
          tenantId:           user.tenantId,
          sessionVersion:     user.sessionVersion,
          onboardingComplete: user.onboardingComplete,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // ── First sign-in ─────────────────────────────────────────────────────
      if (user) {
        // Credentials provider sets these explicitly in authorize()
        if ((user as any).role) {
          token.role               = (user as any).role
          token.tenantId           = (user as any).tenantId
          token.userId             = user.id
          token.sessionVersion     = (user as any).sessionVersion ?? 0
          token.onboardingComplete = (user as any).onboardingComplete
          return token
        }

        // Google / OAuth sign-in — PrismaAdapter creates the User row but
        // doesn't set role/tenantId. Read from DB so OAuth users get their
        // real role and can be redirected to the right portal.
        if (account?.provider !== 'credentials') {
          const dbUser = await prisma.user.findUnique({
            where:  { id: user.id! },
            select: { role: true, tenantId: true, status: true, sessionVersion: true, onboardingComplete: true },
          })
          if (dbUser) {
            token.role               = dbUser.role
            token.tenantId           = dbUser.tenantId
            token.userId             = user.id
            token.sessionVersion     = dbUser.sessionVersion
            token.onboardingComplete = dbUser.onboardingComplete
          }
          return token
        }
      }

      // ── Subsequent requests: re-validate against DB ───────────────────────
      // Handles: disabled users, role changes, forced logouts (sessionVersion bump).
      // Runs only in Node.js route handlers — middleware uses auth.config.ts
      // (no Prisma) so this never executes on the Edge runtime.
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.userId as string },
          select: { role: true, tenantId: true, status: true, sessionVersion: true, onboardingComplete: true },
        })

        // User deleted or suspended → invalidate token
        if (!dbUser || dbUser.status === 'INACTIVE' || dbUser.status === 'SUSPENDED') {
          return null as any
        }

        // sessionVersion mismatch → password reset or forced logout occurred
        if (dbUser.sessionVersion !== token.sessionVersion) {
          return null as any
        }

        // Refresh role + tenantId in case they changed since login
        token.role               = dbUser.role
        token.tenantId           = dbUser.tenantId
        token.onboardingComplete = dbUser.onboardingComplete
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id              = token.userId as string
        session.user.role            = token.role as string
        session.user.tenantId        = token.tenantId as string
        session.user.onboardingComplete = token.onboardingComplete as boolean
      }
      return session
    },
  },
})
