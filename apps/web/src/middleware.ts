import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/forgot-password',
  '/pricing', '/features', '/features/', '/about', '/contact',
  '/solutions', '/integrations', '/security', '/status', '/blog',
  '/dashboard', '/deploy', '/welcome',
]

const AUTH_ROUTES = ['/login', '/register']

// Routes that must be on a known subdomain — forward to the right tenant
const TENANT_ROUTES = ['/admin', '/student', '/staff', '/parent']

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') ?? ''

  // ── Subdomain detection ───────────────────────────────────
  // In production: "school.terasms.com" → subdomain = "school"
  // In dev (localhost:3000): no subdomain
  const rootDomains = ['terasms.com', 'localhost', 'vercel.app']
  const isRootDomain = rootDomains.some(d => host === d || host.startsWith(`www.${d}`) || host.endsWith(`:3000`) || host.endsWith(`:3001`))
  const subdomain = !isRootDomain
    ? host.split('.')[0]
    : null

  // Attach subdomain to response headers so server components can read it
  const response = NextResponse.next()
  if (subdomain) {
    response.headers.set('x-tenant-slug', subdomain)
  }

  const isLoggedIn = !!req.auth
  const isPublic   = PUBLIC_ROUTES.some(r =>
    pathname === r || pathname.startsWith('/api/auth') || pathname.startsWith('/api/v1/') ||
    pathname.startsWith('/api/invite/') ||
    pathname.startsWith('/_next') || pathname.startsWith('/docs') || pathname.startsWith('/blog') ||
    pathname.startsWith('/invite/'),
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

  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
