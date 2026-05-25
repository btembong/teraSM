import { ArrowRight, FileSpreadsheet, Users, Zap, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    n: '01',
    icon: FileSpreadsheet,
    title: 'Export your current data',
    desc: 'Export students, staff, courses, and fee records from whatever you use today — Excel, Google Sheets, any format. We handle it all.',
    note: 'CSV, Excel, JSON, or raw database dump',
  },
  {
    n: '02',
    icon: Users,
    title: 'We import and map everything',
    desc: 'Our onboarding team takes your files and maps every record into Tera SM. Students, timetables, fee histories — nothing is lost.',
    note: 'Free migration support included on all plans',
  },
  {
    n: '03',
    icon: Zap,
    title: 'Go live in days, not months',
    desc: 'Share login links with your staff and students. They onboard themselves through guided setup flows. You are live before the week is out.',
    note: 'Average go-live time: under 1 week',
  },
]

const objections = [
  {
    q: 'What if we have years of historical data?',
    a: 'We import up to 10 years of historical records — grades, attendance, payment history — so your team has full context from day one.',
  },
  {
    q: 'Will staff need training?',
    a: 'Role-specific onboarding guides, video walkthroughs, and a help centre are built in. Most staff are fully operational within 2 days.',
  },
  {
    q: 'What happens to our data if we cancel?',
    a: 'You own your data. Export everything in full at any time. We provide a complete data package within 30 days of cancellation.',
  },
]

export default function SwitchingSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-6">
            <ArrowRight className="w-3.5 h-3.5" />
            Easy migration
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Switching is easier than you think
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Worried about migrating years of data? Our team handles the heavy lifting.
            Most schools are fully live within a week.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-900 dark:via-blue-600 dark:to-blue-900" />

          {steps.map(({ n, icon: Icon, title, desc, note }) => (
            <div key={n} className="relative bg-white dark:bg-gray-800 rounded-3xl p-7 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 relative z-10">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">{n}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">{desc}</p>
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Objection handler */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Common questions about switching</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
              We have helped over 50 institutions migrate from spreadsheets and legacy systems.
              Here are the questions we hear most.
            </p>
            <div className="space-y-5">
              {objections.map(({ q, a }) => (
                <div key={q} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{q}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust card */}
          <div className="bg-blue-600 rounded-3xl p-8 text-white">
            <Clock className="w-10 h-10 text-blue-200 mb-5" />
            <h3 className="text-2xl font-bold mb-3">Average go-live: under 1 week</h3>
            <p className="text-blue-100 mb-8 leading-relaxed">
              From signing up to having staff and students fully active on the platform,
              most schools take 3 to 5 business days. Our onboarding team is with you every step.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Free data migration on all plans',
                'Dedicated onboarding specialist (Pro+)',
                'Role-based training guides included',
                'Your data, your terms, always',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Start your free trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
