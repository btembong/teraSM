import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { LoginSchema } from '@tera-sm/types'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn:  '/login',
    signOut: '/signout',
    error:   '/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    Credentials({
      credentials: { email: {}, password: {}, otp: {} },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        if (!email) return null

        const user = await prisma.user.findFirst({
          where: { email },
          include: { tenant: true },
        })
        if (!user) return null

        // ── OTP verification path ────────────────────────────────────────────
        if (credentials?.otp) {
          if (!user.otpCode || !user.otpExpiry) return null
          if (new Date() > user.otpExpiry) return null // expired
          const otpMatch = await bcrypt.compare(credentials.otp as string, user.otpCode)
          if (!otpMatch) return null
          // Consume OTP
          await prisma.user.update({
            where: { id: user.id },
            data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() },
          })
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            image: user.avatarUrl,
            role: user.role,
            tenantId: user.tenantId,
            onboardingComplete: user.onboardingComplete,
          }
        }

        // ── Password path ────────────────────────────────────────────────────
        const validated = LoginSchema.safeParse(credentials)
        if (!validated.success) return null

        if (!user.passwordHash) return null
        const passwordMatch = await bcrypt.compare(validated.data.password, user.passwordHash)
        if (!passwordMatch) return null

        // If 2FA is enabled the check-2fa route already sent the OTP — deny here
        if (user.twoFactorEnabled) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatarUrl,
          role: user.role,
          tenantId: user.tenantId,
          onboardingComplete: user.onboardingComplete,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.userId = user.id
        token.onboardingComplete = (user as any).onboardingComplete
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.onboardingComplete = token.onboardingComplete as boolean
      }
      return session
    },
  },
})
