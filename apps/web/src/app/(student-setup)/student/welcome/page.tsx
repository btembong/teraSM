import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, GraduationCap, BookOpen, CreditCard, Bell, Users } from 'lucide-react'

export default async function StudentWelcomePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.onboardingComplete) redirect('/student')

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, logoUrl: true },
  })

  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  const highlights = [
    { icon: BookOpen,    label: 'View your courses and timetable'    },
    { icon: CreditCard,  label: 'Pay fees and track your balance'     },
    { icon: Bell,        label: 'Get instant alerts and results'      },
    { icon: Users,       label: 'Connect with classmates and lecturers' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1),_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-2xl">

        {/* School branding */}
        <div className="flex flex-col items-center mb-10">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant?.name} className="w-16 h-16 rounded-2xl object-contain bg-white/10 p-2 mb-4" />
          ) : (
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          )}
          <p className="text-blue-300 text-sm font-medium">{tenant?.name ?? 'Welcome'}</p>
        </div>

        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm text-blue-200 font-medium mb-6">
            <GraduationCap className="w-3.5 h-3.5" />
            Student Portal
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome, {firstName}!
          </h1>
          <p className="text-blue-200 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Your student account is ready. Take a minute to set up your profile so
            your school can reach you and you can make the most of the portal.
          </p>

          {/* Video placeholder */}
          <div className="bg-black/30 border border-white/10 rounded-2xl aspect-video flex flex-col items-center justify-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-indigo-900/40" />
            <div className="relative w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 cursor-pointer hover:bg-white/30 transition-colors">
              <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-l-[18px] border-transparent border-l-white ml-1" />
            </div>
            <p className="relative text-white/70 text-sm">Welcome message from the Dean</p>
            <p className="relative text-white/40 text-xs mt-1">Video coming soon</p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <Icon className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <span className="text-sm text-blue-100">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/student/onboarding"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors text-base shadow-lg shadow-black/20"
          >
            Set up my profile <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-blue-400 text-xs mt-4">
            Takes about 2 minutes
          </p>
        </div>

        {/* Skip link */}
        <div className="text-center mt-6">
          <Link
            href="/api/student/onboarding/skip"
            className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
          >
            Skip for now, go to my dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
