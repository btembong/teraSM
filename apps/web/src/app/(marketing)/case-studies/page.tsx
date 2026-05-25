import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Quote, TrendingUp, Users, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Case Studies — Tera SM',
  description: 'See how schools across Africa use Tera SM to improve attendance tracking, fee collection, student results, and administration efficiency.',
  keywords: ['school management case studies', 'EdTech Africa success stories', 'Tera SM results', 'school software ROI'],
  openGraph: {
    title: 'Case Studies — Tera SM',
    description: 'Real schools. Real results. See how institutions across Africa transformed with Tera SM.',
    url: 'https://terasms.com/case-studies',
  },
  alternates: { canonical: 'https://terasms.com/case-studies' },
}

export const CASE_STUDIES = [
  {
    slug: 'accra-business-college',
    school: 'Accra Business College',
    country: 'Ghana',
    flag: '🇬🇭',
    type: 'College',
    students: 2800,
    plan: 'Pro',
    industry: 'Business & Accounting',
    challenge: 'Managing 2,800 students across 4 campuses with paper-based fee collection and manual attendance tracking was causing revenue leakage and data loss.',
    solution: 'Deployed Tera SM across all 4 campuses in 3 weeks. Digitised fee collection with Paystack integration, implemented QR attendance, and gave students a self-service portal for results and transcripts.',
    quote: 'Within 60 days of going live, our fee collection rate jumped from 71% to 94%. We now have real-time visibility across all campuses from a single dashboard.',
    quotePerson: 'Kwame Asante',
    quoteRole: 'Chief Financial Officer',
    results: [
      { metric: '94%', label: 'Fee collection rate', prev: 'was 71%', icon: TrendingUp },
      { metric: '3 weeks', label: 'Time to go live', prev: 'across 4 campuses', icon: Clock },
      { metric: '2,800', label: 'Students migrated', prev: 'zero data loss', icon: Users },
    ],
    tags: ['Finance', 'Multi-campus', 'Attendance'],
    color: 'from-blue-600 to-blue-800',
    featured: true,
  },
  {
    slug: 'university-of-ibadan-college',
    school: 'Ibadan Technical Institute',
    country: 'Nigeria',
    flag: '🇳🇬',
    type: 'Polytechnic',
    students: 6500,
    plan: 'Enterprise',
    industry: 'Engineering & Technology',
    challenge: 'A backlog of 3,000+ unprocessed transcript requests and an exam results system that took 6 weeks per semester to publish. Staff were overwhelmed with manual paperwork.',
    solution: 'Implemented the academics module with automated result computation, CGPA calculation, and instant transcript generation. Connected the LMS for online assignment submission.',
    quote: 'Our results publication time went from 6 weeks to 48 hours. Students can now download verified transcripts the same day. The registrar\'s office processed the backlog in 2 weeks.',
    quotePerson: 'Dr. Ngozi Obi',
    quoteRole: 'Registrar',
    results: [
      { metric: '48 hrs', label: 'Results published', prev: 'was 6 weeks', icon: Clock },
      { metric: '3,000+', label: 'Transcript backlog cleared', prev: 'in 2 weeks', icon: TrendingUp },
      { metric: '6,500', label: 'Students on platform', prev: 'fully migrated', icon: Users },
    ],
    tags: ['Academics', 'Transcripts', 'LMS'],
    color: 'from-green-600 to-green-800',
    featured: true,
  },
  {
    slug: 'kigali-international-school',
    school: 'Kigali International School',
    country: 'Rwanda',
    flag: '🇷🇼',
    type: 'Secondary School',
    students: 480,
    plan: 'Starter',
    industry: 'K-12 Education',
    challenge: 'A growing international school with 480 students was struggling with parent communication — fee reminders were being missed and parents had no visibility into their child\'s academic progress.',
    solution: 'Deployed the Student Portal, Parent Portal, and automated fee reminder system. Parents now receive push notifications for results, fee dues, and attendance summaries.',
    quote: 'Parent engagement has transformed. They no longer call the office asking about fees or results — everything is in the app. Late fee payments dropped by 60% in one term.',
    quotePerson: 'Sarah Uwamahoro',
    quoteRole: 'Head of Administration',
    results: [
      { metric: '60%', label: 'Drop in late payments', prev: 'in first term', icon: TrendingUp },
      { metric: '4.8/5', label: 'Parent satisfaction score', prev: 'end-of-term survey', icon: Users },
      { metric: '100%', label: 'Parents on portal', prev: 'adoption rate', icon: Clock },
    ],
    tags: ['Parent Portal', 'Finance', 'Communication'],
    color: 'from-teal-600 to-teal-800',
    featured: false,
  },
  {
    slug: 'nairobi-women-university',
    school: 'Nairobi Women\'s University',
    country: 'Kenya',
    flag: '🇰🇪',
    type: 'University',
    students: 9200,
    plan: 'University',
    industry: 'Higher Education',
    challenge: 'A 9,200-student university with 5 faculties running on 4 disconnected legacy systems. HR payroll was manual, live classes used Zoom at significant monthly cost, and the LMS was an unsupported open-source installation.',
    solution: 'Full platform migration: academics, LMS with 200+ course content modules uploaded, built-in live classes replacing Zoom, HR payroll, and a self-service student portal. Migration completed in 8 weeks.',
    quote: 'We replaced four separate tools with one platform and saved $38,000 in annual software licences in year one. Our IT team went from firefighting integrations to building new capabilities.',
    quotePerson: 'Prof. Amina Wanjiku',
    quoteRole: 'Vice Chancellor (Academic Affairs)',
    results: [
      { metric: '$38k', label: 'Annual savings', prev: 'licence cost reduction', icon: TrendingUp },
      { metric: '8 weeks', label: 'Full migration', prev: '4 systems replaced', icon: Clock },
      { metric: '200+', label: 'Courses on LMS', prev: 'in first semester', icon: Users },
    ],
    tags: ['University', 'LMS', 'Live Classes', 'HR'],
    color: 'from-purple-600 to-purple-800',
    featured: true,
  },
  {
    slug: 'dakar-international-polytechnic',
    school: 'Dakar International Polytechnic',
    country: 'Senegal',
    flag: '🇸🇳',
    type: 'Polytechnic',
    students: 3100,
    plan: 'Pro',
    industry: 'Engineering',
    challenge: 'Course registration each semester was a chaotic 3-day event with students queueing at the registrar\'s office, frequent timetable clashes, and hundreds of manual corrections needed post-registration.',
    solution: 'Online course registration with real-time clash detection, seat availability, and prerequisite enforcement. Students now register from anywhere, with results in seconds.',
    quote: 'We went from 3 days of queues and chaos to online registration completing in under 4 hours on opening day. Our registrar\'s team processed zero manual corrections.',
    quotePerson: 'Dr. Mamadou Diallo',
    quoteRole: 'Dean of Student Affairs',
    results: [
      { metric: '4 hours', label: 'Full registration completed', prev: 'was 3 days', icon: Clock },
      { metric: '0', label: 'Manual corrections needed', prev: 'clash detection works', icon: TrendingUp },
      { metric: '3,100', label: 'Students registered online', prev: 'first semester', icon: Users },
    ],
    tags: ['Admissions', 'Registration', 'Academics'],
    color: 'from-orange-600 to-orange-800',
    featured: false,
  },
  {
    slug: 'lagos-model-schools',
    school: 'Lagos Model Schools Group',
    country: 'Nigeria',
    flag: '🇳🇬',
    type: 'Multi-Campus',
    students: 7800,
    plan: 'Enterprise',
    industry: 'K-12 Education',
    challenge: 'A private school group with 12 campuses, 7,800 students, and a central board that had zero visibility into real-time enrollment, fee collection, or staff performance across campuses.',
    solution: 'Enterprise multi-campus deployment with a central analytics dashboard, cross-campus reporting, and standardised HR and payroll across all 12 schools.',
    quote: 'For the first time in 20 years, I can open one dashboard and see exactly what\'s happening across all 12 campuses — enrollment, fees collected today, and which schools have pending payroll. It\'s transformative.',
    quotePerson: 'Mrs. Folake Adeyemi',
    quoteRole: 'Group Managing Director',
    results: [
      { metric: '12', label: 'Campuses unified', prev: 'single platform', icon: Users },
      { metric: 'Real-time', label: 'Group-wide visibility', prev: 'previously impossible', icon: TrendingUp },
      { metric: '22%', label: 'Admin headcount reduction', prev: 'via automation', icon: Clock },
    ],
    tags: ['Multi-campus', 'Analytics', 'HR'],
    color: 'from-indigo-600 to-indigo-800',
    featured: false,
  },
]

const STATS = [
  { value: '50+', label: 'Schools live' },
  { value: '120k+', label: 'Students on platform' },
  { value: '14', label: 'Countries' },
  { value: '4.8/5', label: 'Average satisfaction' },
]

export default function CaseStudiesPage() {
  const featured = CASE_STUDIES.filter(c => c.featured)
  const others = CASE_STUDIES.filter(c => !c.featured)

  return (
    <div className="bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 text-white py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6">
            Real Schools · Real Results
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
            Schools transforming with <span className="text-blue-400">Tera SM</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
            From single-campus secondary schools to multi-site universities — see how institutions across Africa are solving real problems with Tera SM.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured case studies */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10">Featured stories</h2>
        <div className="space-y-8">
          {featured.map((cs) => (
            <Link
              key={cs.slug}
              href={`/case-studies/${cs.slug}`}
              className="group block rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl hover:shadow-blue-50 dark:hover:shadow-blue-950/20 hover:-translate-y-0.5"
            >
              <div className="flex flex-col md:flex-row">
                {/* Colour side */}
                <div className={`bg-gradient-to-br ${cs.color} p-8 md:w-64 flex-shrink-0 flex flex-col justify-between`}>
                  <div>
                    <div className="text-3xl mb-2">{cs.flag}</div>
                    <p className="text-white font-bold text-lg leading-tight">{cs.school}</p>
                    <p className="text-white/70 text-sm mt-1">{cs.type} · {cs.country}</p>
                  </div>
                  <div className="mt-6 space-y-1">
                    {cs.tags.map(t => (
                      <span key={t} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded text-xs bg-white/20 text-white">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {cs.results.map((r) => (
                      <div key={r.label} className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{r.metric}</div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.label}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{r.prev}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="border-l-2 border-blue-500 pl-4 mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic leading-relaxed">&ldquo;{cs.quote}&rdquo;</p>
                    <footer className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      — {cs.quotePerson}, {cs.quoteRole}
                    </footer>
                  </blockquote>

                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:gap-3 transition-all">
                    Read full case study <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Other case studies */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10">More stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {others.map((cs) => (
              <Link
                key={cs.slug}
                href={`/case-studies/${cs.slug}`}
                className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className={`bg-gradient-to-br ${cs.color} p-6`}>
                  <div className="text-2xl mb-2">{cs.flag}</div>
                  <p className="text-white font-bold">{cs.school}</p>
                  <p className="text-white/70 text-sm">{cs.type} · {cs.country}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {cs.results.map(r => (
                      <div key={r.label} className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{r.metric}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{r.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-3 mb-4">&ldquo;{cs.quote}&rdquo;</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {cs.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:gap-2 transition-all">
                    Read story <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <Quote className="w-8 h-8 text-blue-200 dark:text-blue-800 mx-auto mb-6" />
        <p className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
          "The most impactful decision we made was centralising our entire school operation on one platform. The ROI was visible within the first semester."
        </p>
        <p className="text-gray-500 dark:text-gray-400">Mrs. Folake Adeyemi, Group MD — Lagos Model Schools</p>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to write your own success story?</h2>
          <p className="text-blue-100 mb-8">Start a free 14-day trial or book a personalised demo with our team.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Start Free Trial
            </Link>
            <Link href="/contact" className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl border border-blue-400 transition-colors">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
