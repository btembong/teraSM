import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Use the Edge-safe config (no Prisma) for middleware.
// Route handlers and server components use the full auth.ts (Node.js).
const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/forgot-password',
  '/auth/forgot-password', '/auth/reset-password',
  '/pricing', '/features', '/features/', '/about', '/contact',
  '/solutions', '/integrations', '/security', '/status', '/blog',
  '/dashboard', '/deploy', '/welcome',
  '/alumni/register',
  '/kiosk',
]

const AUTH_ROUTES = ['/login', '/register']

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') ?? ''

  // ── Subdomain detection ───────────────────────────────────
  // In production: "school.terasms.com" → subdomain = "school"
  // In dev (localhost:3000): no subdomain
  const rootDomains = ['terasms.com', 'localhost', 'vercel.app']
  const isRootDomain = rootDomains.some(d =>
    host === d || host.startsWith(`www.${d}`) || host.endsWith(`:3000`) || host.endsWith(`:3001`)
  )
  const subdomain = !isRootDomain ? host.split('.')[0] : null

  // Attach subdomain to response headers so server components can read it
  const response = NextResponse.next()
  if (subdomain) {
    response.headers.set('x-tenant-slug', subdomain)
  }

  const isLoggedIn = !!req.auth
  const isPublic   = PUBLIC_ROUTES.some(r =>
    pathname === r || pathname.startsWith('/api/auth') || pathname.startsWith('/api/v1/') ||
    pathname.startsWith('/api/invite/') || pathname.startsWith('/api/cron/') || pathname.startsWith('/api/book-demo') ||
    pathname.startsWith('/api/student/onboarding') || pathname.startsWith('/api/alumni/register') ||
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/kiosk/') ||
    pathname.startsWith('/api/user/change-password') ||
    pathname.startsWith('/alumni/register') ||
    pathname.startsWith('/kiosk') ||
    pathname.startsWith('/change-password') ||
    pathname.startsWith('/_next') || pathname.startsWith('/docs') || pathname.startsWith('/blog') ||
    pathname.startsWith('/invite/') || pathname.startsWith('/verify/'),
  )
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Protect all non-public routes
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Force password change before accessing any portal
  if (isLoggedIn && (req.auth as any)?.user?.mustChangePassword) {
    if (pathname !== '/change-password' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/change-password', req.url))
    }
  }

  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
