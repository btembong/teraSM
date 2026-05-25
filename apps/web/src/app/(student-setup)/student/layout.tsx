import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function StudentSetupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'STUDENT') redirect('/dashboard')
  return <>{children}</>
}
