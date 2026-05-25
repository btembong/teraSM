import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Role → portal mapping
const ROLE_REDIRECT: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  TENANT_ADMIN: '/admin',
  REGISTRAR: '/admin',
  FINANCE_ADMIN: '/admin',
  HR_ADMIN: '/admin',
  STAFF: '/admin',
  TEACHER: '/staff',
  STUDENT: '/student',
  PARENT: '/parent',
}

export default async function DashboardRedirect() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // First-ever login for admin roles → show welcome letter
  const adminRoles = ['TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN', 'STAFF']
  if (adminRoles.includes(session.user.role) && session.user.onboardingComplete === false) {
    redirect('/welcome')
  }

  // First-ever login for students → show student welcome + onboarding wizard
  if (session.user.role === 'STUDENT' && session.user.onboardingComplete === false) {
    redirect('/student/welcome')
  }

  const role = session.user.role ?? 'STUDENT'
  const destination = ROLE_REDIRECT[role] ?? '/student'
  redirect(destination)
}
