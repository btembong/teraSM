import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — zero Prisma / Node.js-only imports.
// Used by middleware to verify the JWT without hitting the database.
// Route handlers use the full `auth.ts` (which extends this).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn:  '/login',
    signOut: '/signout',
    error:   '/login',
  },
  // Providers are declared in auth.ts (they need Prisma in authorize()).
  // Middleware only needs to read an existing JWT — no providers required.
  providers: [],
  callbacks: {
    // Populate JWT fields on first sign-in from the object returned by
    // authorize(). Subsequent requests just pass the token through; the
    // full DB validation happens inside auth.ts when route handlers call auth().
    jwt({ token, user }) {
      if (user && (user as any).role) {
        token.role               = (user as any).role
        token.tenantId           = (user as any).tenantId
        token.userId             = user.id
        token.sessionVersion     = (user as any).sessionVersion ?? 0
        token.onboardingComplete = (user as any).onboardingComplete
        token.mustChangePassword = (user as any).mustChangePassword ?? false
      }
      return token
    },

    session({ session, token }) {
      if (token) {
        session.user.id               = token.userId as string
        session.user.role             = token.role as string
        session.user.tenantId         = token.tenantId as string
        session.user.onboardingComplete  = token.onboardingComplete as boolean
        session.user.mustChangePassword  = token.mustChangePassword as boolean
      }
      return session
    },
  },
}
