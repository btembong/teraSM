import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Quote, TrendingUp, Users, Clock, Building2 } from 'lucide-react'
import { CASE_STUDIES } from '../page'

export async function generateStaticParams() {
  return CASE_STUDIES.map(cs => ({ slug: cs.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cs = CASE_STUDIES.find(c => c.slug === slug)
  if (!cs) return { title: 'Case Study — Tera SM' }
  return {
    title: `${cs.school} Case Study — Tera SM`,
    description: `How ${cs.school} used Tera SM to transform their operations. ${cs.results.map(r => `${r.metric} ${r.label}`).join(', ')}.`,
    openGraph: {
      title: `${cs.school} — Tera SM Case Study`,
      description: cs.quote,
      url: `https://terasms.com/case-studies/${slug}`,
    },
    alternates: { canonical: `https://terasms.com/case-studies/${slug}` },
  }
}

const DETAIL: Record<string, {
  problem: string[]
  solution: string[]
  implementation: { phase: string; title: string; desc: string }[]
  outcomes: string[]
  modules: string[]
}> = {
  'accra-business-college': {
    problem: [
      'Fee collection was entirely manual — students queued at the bursary office with cash, receipts were handwritten, and reconciliation took days at month-end.',
      'Attendance was marked on paper registers that were collected weekly by the admin office. By the time absence patterns were noticed, weeks had passed.',
      'With 4 campuses, each running independently, there was no consolidated view of enrollment numbers, outstanding fees, or results for the finance committee.',
      'Results were shared via printed notices pinned to noticeboards. Students traveled to campus just to check their grades.',
    ],
    solution: [
      'Deployed Tera SM across all 4 campuses simultaneously after a 2-week data migration from Excel-based records.',
      'Integrated Paystack for online fee payment — students now pay from their phones in under 2 minutes. Automated late fee engine applies penalties after grace periods.',
      'QR-code attendance deployed in all lecture halls. Lecturers display a rotating QR code; students scan it on entry. Absence alerts sent to students and their programme coordinator within the hour.',
      'Student portal launched with results, transcript download, fee statements, and timetable — all self-service.',
      'Central analytics dashboard gives the finance committee real-time collection rates, arrears aging, and enrollment figures across all campuses.',
    ],
    implementation: [
      { phase: '01', title: 'Data migration', desc: 'Student records, fee structures, and course catalog migrated from Excel over 2 weeks with zero disruption to ongoing semester.' },
      { phase: '02', title: 'Staff training', desc: '3-day on-site training for admin, finance, and academic staff. All 120 staff members went through role-specific sessions.' },
      { phase: '03', title: 'Soft launch', desc: 'Ran Tera SM alongside existing systems for 2 weeks to validate data integrity before full cutover.' },
      { phase: '04', title: 'Full go-live', desc: 'All 4 campuses live simultaneously. Dedicated Tera SM support engineer on-site for week 1.' },
    ],
    outcomes: [
      'Fee collection rate increased from 71% to 94% within 60 days — the highest rate in the college\'s 18-year history.',
      'Admin headcount required for fee processing reduced by 40% through automation.',
      'Attendance data now available in real time — absenteeism intervention happens within the same week.',
      'Student satisfaction scores increased from 3.2/5 to 4.5/5 on the end-of-year survey.',
      'The finance committee went from receiving monthly paper reports to daily live dashboards.',
    ],
    modules: ['Finance', 'Attendance', 'Student Portal', 'Analytics', 'Multi-campus'],
  },
  'university-of-ibadan-college': {
    problem: [
      'Result computation was entirely manual. Lecturers submitted paper grade sheets; the exam office entered them into spreadsheets and manually calculated GPA for each student across 6,500 records.',
      'A backlog of 3,000+ transcript requests had built up. Processing each request took 3–5 working days and required physical stamps and signatures from the Registrar.',
      'The existing LMS (an unsupported open-source install) had no mobile access, no assignment submission, and was used by fewer than 15% of lecturers.',
      'Exam timetable clashes were discovered only after printing — requiring manual corrections and re-printing at significant cost.',
    ],
    solution: [
      'Migrated all student academic records into Tera SM\'s academics module. Grading system configured to match the institution\'s letter grade and GPA scale.',
      'Lecturers now enter CA and exam scores directly into the platform. The system auto-computes total scores, letter grades, grade points, and CGPA instantly.',
      'Transcript generation automated — students request and download official PDF transcripts (watermarked, with QR authentication code) instantly after results publication.',
      'LMS rolled out to all 200+ course offerings. Lecturers upload materials, set assignments, and grade submissions online.',
      'Exam timetable generator used to produce a clash-free schedule across all programmes.',
    ],
    implementation: [
      { phase: '01', title: 'Grade schema setup', desc: 'Configured grading boundaries, credit-hour weights, and CGPA rules to match existing institutional standards.' },
      { phase: '02', title: 'Historical data import', desc: 'Imported 5 years of historical grade data for all students to populate grade history and CGPA continuity.' },
      { phase: '03', title: 'Lecturer onboarding', desc: 'Two-day workshop for all 340 academic staff. LMS adoption reached 80% within the first month.' },
      { phase: '04', title: 'Backlog clearance', desc: 'Registrar\'s team used bulk transcript generation to clear the 3,000+ pending request backlog in 2 weeks.' },
    ],
    outcomes: [
      'Results published within 48 hours of exam closure — down from 6 weeks.',
      'Entire 3,000+ transcript backlog cleared in 2 weeks using batch generation.',
      'LMS adoption reached 85% of active course offerings within the first semester.',
      'Exam timetable generated with zero clashes in under 2 hours — previously a 3-week manual process.',
      'Zero grade computation errors reported in the first two semesters on the platform.',
    ],
    modules: ['Academics', 'LMS', 'Transcripts', 'Exam Scheduling', 'Grading'],
  },
  'kigali-international-school': {
    problem: [
      'Parents had no visibility into their child\'s academic progress between formal report card periods. The only contact was the school phone line — creating constant calls to the admin office.',
      'Fee reminders were sent as printed letters in student bags — many never reached parents. Late payment rates were consistently above 30%.',
      'The school had no digital channel for announcements. Parents learned about events and closures through word of mouth or school noticeboards.',
    ],
    solution: [
      'Deployed the Parent Portal giving parents real-time access to their child\'s grades, attendance, timetable, and fee balance.',
      'Automated fee reminder system configured with 7-day, 3-day, and 1-day alerts via push notification, email, and SMS.',
      'Announcements module used for school-wide and class-specific broadcasts. Parents receive push notifications instantly.',
      'Integrated Paystack for parents to pay fees directly from the portal — no bank visits required.',
    ],
    implementation: [
      { phase: '01', title: 'Parent onboarding', desc: 'Every parent received an invitation link via SMS and email. School held 2 evening info sessions to walk parents through the portal.' },
      { phase: '02', title: 'Fee configuration', desc: 'Term fee structures, sibling discounts, and scholarship deductions configured. Outstanding balances imported from previous system.' },
      { phase: '03', title: 'Staff training', desc: 'Teachers trained on grade entry and attendance marking. Admin team trained on announcements and report generation.' },
      { phase: '04', title: 'Go-live', desc: 'All 480 students live at start of new term. 100% parent portal adoption achieved within 3 weeks.' },
    ],
    outcomes: [
      'Late fee payments dropped by 60% in the first term following automated reminders.',
      '100% of parents registered on the portal within 3 weeks of launch.',
      'Admin call volume for fee and results enquiries dropped by 75% — freeing staff for higher-value tasks.',
      'Parent satisfaction score of 4.8/5 in end-of-term survey — highest in school history.',
      'Announcement reach went from an estimated 40% (noticeboard) to 98% (push notification read rate).',
    ],
    modules: ['Parent Portal', 'Finance', 'Communication', 'Announcements'],
  },
  'nairobi-women-university': {
    problem: [
      'Four disconnected systems — a legacy SIS, Moodle LMS, Zoom for live classes, and a spreadsheet-based HR payroll — required constant manual data re-entry and reconciliation between them.',
      'Zoom licences for live classes cost $42,000 per year and required students to install a separate app. Recording storage was managed manually via Google Drive with no integration to the LMS.',
      'HR payroll was processed manually by a team of 6. Monthly payslips were printed and distributed in person. Any payroll error required a manual correction cycle taking 3–4 days.',
      'The Moodle instance was 4 versions behind on updates and unsupported. A security audit flagged it as a high-risk system.',
    ],
    solution: [
      'Full platform migration completed in 8 weeks — academics, LMS, live classes, HR payroll, and student portal all live simultaneously at the start of a new semester.',
      'Built-in WebRTC live classes replaced Zoom entirely. Class recordings auto-linked to the LMS course page. No student app install required.',
      '200+ course modules migrated from Moodle, with all historical assignment submissions and grades preserved.',
      'HR payroll configured for all 580 staff. Payslips now generated and delivered digitally. Payroll run time reduced from 5 days to 4 hours.',
      'Finance module connected to the fee payment gateway. Scholarship management automated — bursary deductions applied at invoice generation.',
    ],
    implementation: [
      { phase: '01', title: 'Discovery & planning', desc: 'Tera SM implementation team spent 2 weeks on-site auditing existing systems, data schemas, and integration requirements.' },
      { phase: '02', title: 'Data migration', desc: 'Student records (9,200), course catalog (200+ courses), 5-year grade history, and staff records (580) migrated with validation.' },
      { phase: '03', title: 'Parallel running', desc: 'Ran Tera SM alongside existing systems for 3 weeks, cross-checking data integrity before cutover.' },
      { phase: '04', title: 'Go-live & hypercare', desc: 'Dedicated Tera SM implementation engineer on-site for 4 weeks post-launch. All critical issues resolved within 24 hours.' },
    ],
    outcomes: [
      'Saved $38,000 in annual software licence costs in year one (Zoom + Moodle + legacy SIS combined).',
      'Payroll run time reduced from 5 days to 4 hours. Zero payroll errors in first 6 months.',
      'Live class attendance tracking automated — lecturers no longer maintain separate attendance registers.',
      'LMS security risk eliminated — fully supported, actively updated platform.',
      'IT team redirected from maintaining 4 systems to building new institutional capabilities on the open API.',
    ],
    modules: ['LMS', 'Live Classes', 'HR & Payroll', 'Finance', 'Academics', 'Student Portal'],
  },
  'dakar-international-polytechnic': {
    problem: [
      'Course registration was an in-person event held over 3 days at the start of each semester. Students queued from early morning to secure places in popular courses.',
      'Timetable clashes were detected only after registration closed, requiring the registrar\'s office to manually contact affected students and find alternative sections.',
      'Prerequisite enforcement relied on staff manually checking student transcripts — an error-prone process that regularly allowed students to register for courses they were not eligible for.',
      'Registration data took 2 weeks to consolidate into final class lists, delaying lecturer preparation and room allocation.',
    ],
    solution: [
      'Online course registration portal deployed. Students browse the full course catalog with filters, see real-time seat availability, and complete registration from any device.',
      'Automatic clash detection — the system checks new selections against already-registered slots in real time and blocks conflicts before confirmation.',
      'Prerequisite validation automated — the system checks each student\'s grade history before allowing registration. Ineligible courses are greyed out with a clear explanation.',
      'Class lists available to lecturers in real time as students register — no waiting for consolidation.',
    ],
    implementation: [
      { phase: '01', title: 'Course catalog setup', desc: 'All 180 courses configured with prerequisites, credit hours, sections, and seat capacities. Timetable slots loaded for the semester.' },
      { phase: '02', title: 'Student grade history import', desc: 'Historical grade records imported to enable prerequisite validation from day one.' },
      { phase: '03', title: 'Staff training', desc: 'Registrar team trained on course management and override capabilities. IT team trained on system configuration.' },
      { phase: '04', title: 'Registration day', desc: 'System opened at 8am. All 3,100 students registered within 4 hours. Zero queue, zero manual corrections.' },
    ],
    outcomes: [
      'Registration completed in 4 hours on opening day — down from 3 days of in-person queueing.',
      'Zero manual corrections required post-registration — clash and prerequisite checks eliminated all conflicts at source.',
      'Lecturers had final class lists within hours of registration opening, not 2 weeks later.',
      'Student complaints about registration dropped by 94% compared to the previous semester.',
      'Registrar\'s team freed from 3-day registration event — redeployed to advising and student support.',
    ],
    modules: ['Admissions', 'Course Registration', 'Academics', 'Timetable'],
  },
  'lagos-model-schools': {
    problem: [
      'The 12-campus group had no unified view of operations. Each campus ran independently with its own Excel spreadsheets, WhatsApp groups for communication, and manual payroll process.',
      'Monthly board reporting required a 4-person team to manually collect data from 12 campus administrators, consolidate it, and produce reports — a process that took 10 days each month.',
      'Staff payroll was processed separately at each campus. Errors were common, corrections took days, and the group had no central visibility into total payroll cost.',
      'There was no standardised curriculum or assessment framework across campuses — each school followed slightly different grading and reporting conventions.',
    ],
    solution: [
      'Enterprise multi-campus deployment with all 12 campuses connected to a single Tera SM instance. Each campus retains autonomy for day-to-day operations while the group board has full visibility.',
      'Centralised analytics dashboard gives the MD and board real-time enrollment, fee collection, attendance, and payroll data across all campuses.',
      'Standardised grading schema and report card templates deployed across all campuses, bringing consistency to academic reporting.',
      'HR payroll centralised — all 420 staff across 12 campuses now processed in a single monthly run. Payslips delivered digitally.',
      'Group-wide announcement system allows the board to broadcast to all students, all parents, or all staff across every campus simultaneously.',
    ],
    implementation: [
      { phase: '01', title: 'Phased campus rollout', desc: 'Started with 3 pilot campuses in month 1, then rolled out remaining 9 in batches of 3 over the following 6 weeks.' },
      { phase: '02', title: 'Data standardisation', desc: 'Worked with each campus to standardise grading scales, fee structures, and HR records before migration.' },
      { phase: '03', title: 'Admin training', desc: 'Each campus administrator received 2 days of training. A super-admin layer was configured for the group board.' },
      { phase: '04', title: 'Board dashboard launch', desc: 'Group analytics dashboard configured for the MD and board — customised to show KPIs critical to the group\'s strategic objectives.' },
    ],
    outcomes: [
      'Monthly board reporting reduced from a 10-day manual process to instant real-time dashboards.',
      'Admin headcount reduced by 22% across the group through shared services and automation.',
      'Payroll error rate dropped to zero in the first fully centralised payroll run.',
      'Group-wide fee collection rate increased from 76% to 91% within one academic year.',
      'First-ever group-wide academic performance dashboard revealed which campuses needed targeted curriculum support.',
    ],
    modules: ['Multi-campus', 'Analytics', 'HR & Payroll', 'Finance', 'Communication'],
  },
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cs = CASE_STUDIES.find(c => c.slug === slug)
  if (!cs) notFound()

  const detail = DETAIL[slug]
  const currentIndex = CASE_STUDIES.indexOf(cs)
  const next = CASE_STUDIES[(currentIndex + 1) % CASE_STUDIES.length]

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">

      {/* Hero */}
      <div className={`bg-gradient-to-br ${cs.color} text-white`}>
        <div className="max-w-5xl mx-auto px-6 py-14 md:py-20">
          <Link href="/case-studies" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All case studies
          </Link>
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium">{cs.type}</span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium">{cs.flag} {cs.country}</span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium">{cs.students.toLocaleString()} students</span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium">Tera SM {cs.plan}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{cs.school}</h1>
          <p className="text-white/80 text-lg max-w-2xl">{cs.challenge}</p>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-6 mt-10 max-w-xl">
            {cs.results.map(r => (
              <div key={r.label}>
                <div className="text-3xl font-bold text-white">{r.metric}</div>
                <div className="text-sm text-white/80 font-medium">{r.label}</div>
                <div className="text-xs text-white/60">{r.prev}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Jump to</p>
                <nav className="space-y-1">
                  {[
                    { href: '#problem', label: 'The Problem' },
                    { href: '#solution', label: 'The Solution' },
                    { href: '#implementation', label: 'Implementation' },
                    { href: '#outcomes', label: 'Outcomes' },
                  ].map(l => (
                    <a key={l.href} href={l.href} className="block text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-0.5 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Modules used</p>
                <div className="space-y-1">
                  {detail?.modules.map(m => (
                    <div key={m} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {m}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Get similar results</p>
                <Link href="/contact" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Book a demo →</Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-14">

            {/* Problem */}
            {detail && (
              <section id="problem">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">The Problem</h2>
                <div className="space-y-4">
                  {detail.problem.map((p, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                      <span className="text-red-400 text-lg flex-shrink-0 mt-0.5">✕</span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Solution */}
            {detail && (
              <section id="solution">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">The Solution</h2>
                <div className="space-y-4">
                  {detail.solution.map((s, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pull quote */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8">
              <Quote className="w-7 h-7 text-blue-300 dark:text-blue-700 mb-4" />
              <blockquote className="text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed mb-5">
                &ldquo;{cs.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {cs.quotePerson.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{cs.quotePerson}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{cs.quoteRole}, {cs.school}</p>
                </div>
              </div>
            </div>

            {/* Implementation */}
            {detail && (
              <section id="implementation">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Implementation</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {detail.implementation.map(ph => (
                    <div key={ph.phase} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-blue-100 dark:text-blue-900 mb-1">{ph.phase}</div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{ph.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{ph.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Outcomes */}
            {detail && (
              <section id="outcomes">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Outcomes</h2>
                <div className="space-y-3">
                  {detail.outcomes.map((o, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{o}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Metrics recap */}
            <div className={`bg-gradient-to-br ${cs.color} rounded-2xl p-8`}>
              <h3 className="text-lg font-bold text-white mb-6">Results at a glance</h3>
              <div className="grid grid-cols-3 gap-6">
                {cs.results.map(r => (
                  <div key={r.label} className="text-center">
                    <div className="text-3xl font-bold text-white">{r.metric}</div>
                    <div className="text-sm text-white/80 font-medium mt-1">{r.label}</div>
                    <div className="text-xs text-white/60 mt-0.5">{r.prev}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-8 text-center">
              <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to see results like these?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Book a personalised demo — we'll show you exactly how Tera SM works for your institution type and size.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
                  Book a Demo
                </Link>
                <Link href="/register" className="px-6 py-2.5 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold rounded-xl text-sm transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next case study */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Next case study</p>
          <Link href={`/case-studies/${next.slug}`} className="group flex items-center justify-between p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${next.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                {next.flag}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{next.school}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{next.type} · {next.country}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

    </div>
  )
}
