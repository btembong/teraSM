import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <header className="flex items-center justify-between border-b bg-white/80 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-primary-700 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold">T</div>
          Tera SM
        </div>
        <p className="text-sm text-muted-foreground">Setting up your school</p>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">{children}</main>
    </div>
  )
}
